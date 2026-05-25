using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.StressDetection.Configurations;

internal sealed class StressSessionConfiguration : IEntityTypeConfiguration<StressSession>
{
    public void Configure(EntityTypeBuilder<StressSession> builder)
    {
        builder.ToTable("stress_sessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(s => s.DeviceId)
            .IsRequired();

        builder.HasOne(s => s.Device)
            .WithMany()
            .HasForeignKey(s => s.DeviceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.StartedAt)
            .IsRequired();

        builder.Property(s => s.MetricsCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.ReadingsCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.AverageStressScore)
            .IsRequired()
            .HasDefaultValue(0d);

        builder.Property(s => s.PeakStressScore)
            .IsRequired()
            .HasDefaultValue(0d);

        builder.Property(s => s.Notes)
            .HasMaxLength(500);

        builder.Property(s => s.EndReason)
            .HasMaxLength(200);

        // List sessions by user, newest first.
        builder.HasIndex(s => new { s.UserId, s.StartedAt });

        // Fast lookup of an active/paused session for a user.
        // Filter expression must reference the actual snake_cased column names.
        builder.HasIndex(s => new { s.UserId, s.Status })
            .HasFilter("status IN ('Active', 'Paused')");

        builder.HasMany(s => s.Readings)
            .WithOne(r => r.Session)
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
