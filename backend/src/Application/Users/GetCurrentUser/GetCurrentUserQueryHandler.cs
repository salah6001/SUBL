using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Users.Common;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.GetCurrentUser;

/// <summary>
/// Handler for GetCurrentUserQuery.
/// Returns the currently authenticated user's information.
/// </summary>
internal sealed class GetCurrentUserQueryHandler : IQueryHandler<GetCurrentUserQuery, UserResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentUserQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<UserResponse>> Handle(
        GetCurrentUserQuery query,
        CancellationToken cancellationToken)
    {
        User? user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken);

        if (user is null)
        {
            return Result.Failure<UserResponse>(UserErrors.NotFound(_currentUser.UserId));
        }

        // Resolve the user's company via their account membership. A user can
        // belong to more than one account, so prefer the primary active
        // contact, then any active one.
        string? companyName = await _context.AccountContacts
            .AsNoTracking()
            .Where(c => c.UserId == user.Id && c.IsActive)
            .OrderByDescending(c => c.IsPrimaryContact)
            .Select(c => c.Account!.Name)
            .FirstOrDefaultAsync(cancellationToken);

        // Single-company product: users (and admins) who aren't linked to an
        // account contact still see the organisation's name. Fall back to the
        // primary (earliest-created) account so the company banner shows for
        // everyone in both dashboards.
        if (string.IsNullOrEmpty(companyName))
        {
            companyName = await _context.Accounts
                .AsNoTracking()
                .OrderBy(a => a.CreatedAt)
                .Select(a => a.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AccountType = user.AccountType,
            Status = user.Status,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            CompanyName = companyName
        };
    }
}
