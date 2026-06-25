using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Users.Common;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.GetCurrentUserProfile;

/// <summary>
/// Handler for GetCurrentUserProfileQuery.
/// Returns the current user's profile.
/// </summary>
internal sealed class GetCurrentUserProfileQueryHandler : IQueryHandler<GetCurrentUserProfileQuery, UserProfileResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentUserProfileQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<UserProfileResponse>> Handle(
        GetCurrentUserProfileQuery query,
        CancellationToken cancellationToken)
    {
        UserProfileResponse? profile = await _context.UserProfiles
            .AsNoTracking()
            .Where(p => p.UserId == _currentUser.UserId)
            .Select(p => new UserProfileResponse
            {
                Id = p.Id,
                UserId = p.UserId,
                Department = p.Department.ToString(),
                DisplayJobTitle = p.DisplayJobTitle,
                PhoneNumber = p.PhoneNumber,
                HireDate = p.HireDate,
                AvatarUrl = p.AvatarUrl != null ? p.AvatarUrl.ToString() : null,
                Bio = p.Bio,
                Skills = p.Skills
            })
            .FirstOrDefaultAsync(cancellationToken);

        // A profile-less account (older sign-ups) should still load: return an
        // empty default so the dashboard/settings show the real identity from
        // /users/me with blank profile fields instead of failing to a mock.
        profile ??= new UserProfileResponse
        {
            Id = Guid.Empty,
            UserId = _currentUser.UserId,
            Department = Domain.Common.Department.Unassigned.ToString(),
            Skills = []
        };

        return Result.Success(profile);
    }
}
