namespace Domain.Common;

/// <summary>
/// Represents the organizational departments within the system.
/// </summary>
public enum Department
{
    /// <summary>
    /// No department assigned yet (e.g. a freshly self-registered user the
    /// admin has not placed into a team). Departments are user-centric and
    /// assigned by an administrator.
    /// </summary>
    Unassigned = 0,

    /// <summary>
    /// Software development and engineering team.
    /// </summary>
    Development = 1,

    /// <summary>
    /// Data science and ML analysis team.
    /// </summary>
    DataScience = 2,

    /// <summary>
    /// Operations and administration team.
    /// </summary>
    Operations = 3,

    /// <summary>
    /// Management and administration team.
    /// </summary>
    Management = 4
}
