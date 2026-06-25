using Domain.Users;

namespace Application.Users.Common;

public sealed record UserResponse
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public AccountType AccountType { get; init; }
    public UserStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }

    /// <summary>
    /// Name of the account (company) the user belongs to, resolved via the
    /// user's primary/active account contact. Null when the user is not
    /// associated with any account.
    /// </summary>
    public string? CompanyName { get; init; }
}
