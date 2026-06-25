using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Domain.Common;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.UpdateCurrentUserProfile;

/// <summary>
/// Handler for UpdateCurrentUserProfileCommand.
/// Updates the current user's profile.
/// </summary>
internal sealed class UpdateCurrentUserProfileCommandHandler : ICommandHandler<UpdateCurrentUserProfileCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateCurrentUserProfileCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(UpdateCurrentUserProfileCommand command, CancellationToken cancellationToken)
    {
        UserProfile? profile = await _context.UserProfiles
            .FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId, cancellationToken);

        // Upsert: older accounts (and any created before profiles were seeded at
        // registration) may not have a profile row yet. Create one on first save
        // so the user can always edit their own profile.
        if (profile is null)
        {
            profile = UserProfile.Create(_currentUser.UserId, Department.Unassigned);
            _context.UserProfiles.Add(profile);
        }

        // Update contact info
        profile.UpdateContactInfo(command.PhoneNumber);

        // Update the client-facing job title (keep the internal title as-is).
        profile.UpdateJobTitles(command.DisplayJobTitle, profile.InternalJobTitle);

        // Update profile
        Uri? avatarUri = !string.IsNullOrWhiteSpace(command.AvatarUrl) 
            ? new Uri(command.AvatarUrl) 
            : null;

        profile.UpdateProfile(
            avatarUri,
            command.Bio,
            command.Skills?.ToList(),
            profile.HireDate); // Keep existing hire date

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
