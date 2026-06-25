using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.StressDetection.Configurations;

internal sealed class StressReadingConfiguration : IEntityTypeConfiguration<StressReading>
{
    public void Configure(EntityTypeBuilder<StressReading> builder)
    {
        builder.ToTable("stress_readings");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.SessionId).IsRequired();
        builder.Property(r => r.UserId).IsRequired();
        builder.Property(r => r.MetricsId).IsRequired();

        builder.HasOne(r => r.Metrics)
            .WithOne()
            .HasForeignKey<StressReading>(r => r.MetricsId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(r => r.Score).IsRequired();
        builder.Property(r => r.Confidence).IsRequired();

        builder.Property(r => r.Level)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.ModelVersion)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.Emotion)
            .HasColumnName("emotion")
            .HasMaxLength(1)
            .IsRequired(false);

        builder.Property(r => r.Metadata)
            .HasColumnType("text");

        builder.Property(r => r.CreatedAt).IsRequired();

        // Time-series queries: readings for a user over a date range.
        builder.HasIndex(r => new { r.UserId, r.CreatedAt });
        builder.HasIndex(r => new { r.SessionId, r.CreatedAt });

        // Reverse-lookup high stress occurrences quickly.
        builder.HasIndex(r => new { r.UserId, r.Level, r.CreatedAt });

        // Emotion aggregation queries (summary endpoint).
        builder.HasIndex(r => new { r.UserId, r.Emotion, r.CreatedAt })
            .HasDatabaseName("ix_stress_readings_user_id_emotion_created_at");
    }
}
