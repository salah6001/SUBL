using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Common;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.Register;

internal sealed class RegisterUserCommandHandler(
    IApplicationDbContext context,
    IIdentityService identityService)
    : ICommandHandler<RegisterUserCommand, Guid>
{
    public async Task<Result<Guid>> Handle(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        // Check if email already exists in Domain
        if (await context.Users.AnyAsync(u => u.Email == command.Email, cancellationToken))
        {
            return Result.Failure<Guid>(UserErrors.EmailNotUnique);
        }

        // Create Domain User (without password - Identity handles that)
        var user = User.Create(
            command.Email,
            command.FirstName,
            command.LastName,
            string.Empty, // Password stored in Identity, not Domain
            AccountType.Staff);

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);

        // Create Identity User (linked to Domain User)
        Result<Guid> identityResult = await identityService.CreateUserAsync(
            user.Id,
            command.Email,
            command.Password,
            cancellationToken);

        if (identityResult.IsFailure)
        {
            // Rollback Domain User if Identity creation fails
            context.Users.Remove(user);
            await context.SaveChangesAsync(cancellationToken);

            return Result.Failure<Guid>(identityResult.Error);
        }

        // Create the user's profile so the dashboard, settings and admin views
        // always have a real (non-mock) row to read/update. Department starts
        // Unassigned — an administrator assigns it later (departments are
        // user-centric). The phone number from sign-up is stored here.
        var profile = UserProfile.Create(user.Id, Department.Unassigned);
        if (!string.IsNullOrWhiteSpace(command.PhoneNumber))
        {
            profile.UpdateContactInfo(command.PhoneNumber);
        }

        context.UserProfiles.Add(profile);
        await context.SaveChangesAsync(cancellationToken);

        return user.Id;
    }
}
