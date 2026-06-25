using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.Login;

internal sealed class LoginUserCommandHandler(
    IApplicationDbContext context,
    IIdentityService identityService) : ICommandHandler<LoginUserCommand, TokenResponse>
{
    public async Task<Result<TokenResponse>> Handle(LoginUserCommand command, CancellationToken cancellationToken)
    {
        // Authenticate via Identity Service
        Result<TokenResponse> loginResult = await identityService.LoginAsync(
            command.Email,
            command.Password,
            command.IpAddress,
            command.UserAgent,
            cancellationToken);

        if (loginResult.IsFailure)
        {
            return loginResult;
        }

        // Update Domain User's last login
        User? user = await context.Users
            .SingleOrDefaultAsync(u => u.Email == command.Email, cancellationToken);

        if (user is not null)
        {
            // Block login for suspended/inactive accounts. Identity only tracks
            // its own IsActive flag, so the domain status (set by the admin
            // Suspend/Deactivate actions) must be enforced here too — otherwise a
            // suspended user could still sign back in after their tokens were revoked.
            if (user.Status == UserStatus.Suspended)
            {
                return Result.Failure<TokenResponse>(UserErrors.UserSuspended);
            }

            if (user.Status == UserStatus.Inactive)
            {
                return Result.Failure<TokenResponse>(UserErrors.UserInactive);
            }

            user.RecordLogin(command.IpAddress, command.UserAgent);
            await context.SaveChangesAsync(cancellationToken);
        }

        return loginResult;
    }
}
