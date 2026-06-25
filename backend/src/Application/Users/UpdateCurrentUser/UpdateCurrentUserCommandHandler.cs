using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.UpdateCurrentUser;

/// <summary>
/// Handler for UpdateCurrentUserCommand.
/// Updates the current user's profile information.
/// </summary>
internal sealed class UpdateCurrentUserCommandHandler : ICommandHandler<UpdateCurrentUserCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identityService;

    public UpdateCurrentUserCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IIdentityService identityService)
    {
        _context = context;
        _currentUser = currentUser;
        _identityService = identityService;
    }

    public async Task<Result> Handle(UpdateCurrentUserCommand command, CancellationToken cancellationToken)
    {
        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken);

        if (user is null)
        {
            return Result.Failure(UserErrors.NotFound(_currentUser.UserId));
        }

        // Email change: keep the domain user and the Identity user in sync so
        // login (which uses the Identity email) never drifts from what the
        // profile shows.
        string? newEmail = command.Email?.Trim();
        if (!string.IsNullOrWhiteSpace(newEmail) &&
            !string.Equals(newEmail, user.Email, StringComparison.OrdinalIgnoreCase))
        {
            bool emailExists = await _context.Users
                .AnyAsync(u => u.Email == newEmail && u.Id != user.Id, cancellationToken);

            if (emailExists)
            {
                return Result.Failure(UserErrors.EmailNotUnique);
            }

            Result emailUpdateResult = await _identityService.UpdateEmailAsync(
                user.Id, newEmail, cancellationToken);

            if (emailUpdateResult.IsFailure)
            {
                return emailUpdateResult;
            }

            user.UpdateEmail(newEmail);
        }

        // Update user information using domain method
        user.UpdateName(command.FirstName, command.LastName);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
