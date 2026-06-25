using Domain.DeviceSettings;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.DeviceSettings;

internal sealed class UserDeviceSettingsConfiguration : IEntityTypeConfiguration<UserDeviceSettings>
{
    public void Configure(EntityTypeBuilder<UserDeviceSettings> builder)
    {
        builder.ToTable("user_device_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(s => s.Language)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.Timezone)
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(s => s.DateFormat)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.Theme)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("system");

        builder.Property(s => s.StressThreshold)
            .IsRequired();

        builder.Property(s => s.MonitoringInterval)
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .IsRequired();
    }
}
