using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.StressDetection.Configurations;

internal sealed class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("devices");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.UserId)
            .IsRequired();

        // Nullable: set when a user claims this device's data stream.
        builder.Property(d => d.ClaimedByUserId);

        builder.HasIndex(d => d.ClaimedByUserId);

        // Computed read-only properties — not columns.
        builder.Ignore(d => d.OwnerId);
        builder.Ignore(d => d.IsOnline);

        builder.HasOne(d => d.User)
            .WithMany()
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(d => d.DeviceName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.DeviceFingerprint)
            .HasMaxLength(256)
            .IsRequired();

        // Same physical machine should only register once per user.
        builder.HasIndex(d => new { d.UserId, d.DeviceFingerprint })
            .IsUnique();

        builder.Property(d => d.Platform)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(d => d.OsVersion)
            .HasMaxLength(100);

        builder.Property(d => d.AgentVersion)
            .HasMaxLength(50);

        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(d => d.LastIpAddress)
            .HasMaxLength(64);

        builder.Property(d => d.CreatedAt)
            .IsRequired();

        builder.HasIndex(d => new { d.UserId, d.IsActive });
    }
}
