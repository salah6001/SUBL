using Application.Abstractions.Data;
using Application.Abstractions.Identity;
using Application.Abstractions.Messaging;
using Application.Abstractions.Repositories;
using Domain.Notifications;
using SharedKernel;

namespace Application.Notifications.ResolveNotification;

internal sealed class ResolveNotificationCommandHandler(
    INotificationRepository notificationRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService)
    : ICommandHandler<ResolveNotificationCommand>
{
    public async Task<Result> Handle(
        ResolveNotificationCommand request,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUserService.UserId;

        Notification? notification = await notificationRepository.GetByIdAsync(
            request.NotificationId,
            userId,
            cancellationToken);

        if (notification is null)
        {
            return Result.Failure(NotificationErrors.NotFound(request.NotificationId));
        }

        notification.Resolve();

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
