using SharedKernel;

namespace Domain.WorkspaceRequests;

public static class WorkspaceRequestErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "WorkspaceRequest.NotFound",
        $"The workspace request with Id = '{id}' was not found");

    public static readonly Error Forbidden = Error.Forbidden(
        "WorkspaceRequest.Forbidden",
        "You are not allowed to manage workspace requests.");

    public static readonly Error NotPending = Error.Problem(
        "WorkspaceRequest.NotPending",
        "This request has already been reviewed.");

    public static readonly Error EmailAlreadyExists = Error.Conflict(
        "WorkspaceRequest.EmailAlreadyExists",
        "An account with this email already exists.");
}
