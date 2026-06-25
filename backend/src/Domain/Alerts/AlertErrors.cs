using SharedKernel;

namespace Domain.Alerts;

public static class AlertErrors
{
    public static Error NotFound(Guid id) => Error.NotFound(
        "Alert.NotFound",
        $"The alert with Id = '{id}' was not found");

    public static readonly Error Forbidden = Error.Forbidden(
        "Alert.Forbidden",
        "You are not allowed to manage alerts.");
}
