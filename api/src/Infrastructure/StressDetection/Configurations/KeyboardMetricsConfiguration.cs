using Domain.StressDetection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.StressDetection.Configurations;

internal sealed class KeyboardMetricsConfiguration : IEntityTypeConfiguration<KeyboardMetrics>
{
    public void Configure(EntityTypeBuilder<KeyboardMetrics> builder)
    {
        builder.ToTable("keyboard_metrics");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.SessionId)
            .IsRequired();

        builder.HasOne(m => m.Session)
            .WithMany()
            .HasForeignKey(m => m.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(m => m.MeanDwell).IsRequired();
        builder.Property(m => m.MedianFlight).IsRequired();
        builder.Property(m => m.CvFlight).IsRequired();
        builder.Property(m => m.MeanDelFreq).IsRequired();
        builder.Property(m => m.MeanTotTime).IsRequired();
        builder.Property(m => m.NKeys).IsRequired();
        builder.Property(m => m.DeleteCount);
        builder.Property(m => m.CapturedAt);
        builder.Property(m => m.ReceivedAt).IsRequired();

        // Most queries fetch metrics by session, ordered chronologically.
        builder.HasIndex(m => new { m.SessionId, m.ReceivedAt });
    }
}
