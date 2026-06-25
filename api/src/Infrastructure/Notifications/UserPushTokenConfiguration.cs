using Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Notifications;

internal sealed class UserPushTokenConfiguration : IEntityTypeConfiguration<UserPushToken>
{
    public void Configure(EntityTypeBuilder<UserPushToken> builder)
    {
        builder.ToTable("user_push_tokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.UserId)
            .IsRequired();

        builder.HasIndex(t => t.UserId);

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(t => t.Token)
            // NOTE: the DB column was widened to varchar(1000) out-of-band to hold
            // the full Web Push subscription JSON (endpoint + keys). We keep the
            // model attribute at 500 to match the existing migration snapshot (this
            // repo applies schema changes manually); EF does not enforce MaxLength
            // on write, so subscriptions up to 1000 chars persist fine.
            .HasMaxLength(500)
            .IsRequired();

        builder.HasIndex(t => t.Token);

        builder.Property(t => t.Platform)
            .IsRequired();

        builder.Property(t => t.DeviceName)
            .HasMaxLength(100);

        builder.Property(t => t.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.LastUsedAt)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .IsRequired();
    }
}
