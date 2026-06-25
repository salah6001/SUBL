using Domain.Alerts;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Alerts;

internal sealed class StressAlertConfiguration : IEntityTypeConfiguration<StressAlert>
{
    public void Configure(EntityTypeBuilder<StressAlert> builder)
    {
        builder.ToTable("stress_alerts");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.UserId)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(a => a.Department)
            .IsRequired();

        builder.Property(a => a.Category)
            .IsRequired();

        builder.Property(a => a.Severity)
            .IsRequired();

        builder.Property(a => a.Status)
            .IsRequired();

        builder.Property(a => a.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(a => a.Message)
            .HasMaxLength(1000);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasIndex(a => new { a.Status, a.CreatedAt });
        builder.HasIndex(a => a.Department);
    }
}
