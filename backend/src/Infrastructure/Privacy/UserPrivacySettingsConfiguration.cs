using Domain.Privacy;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Privacy;

internal sealed class UserPrivacySettingsConfiguration : IEntityTypeConfiguration<UserPrivacySettings>
{
    public void Configure(EntityTypeBuilder<UserPrivacySettings> builder)
    {
        builder.ToTable("user_privacy_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(s => s.KeystrokeDynamics)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.SentimentAnalysis)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.ProductAnalytics)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.EmployerDataSharing)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.UpdatedAt)
            .IsRequired();
    }
}
