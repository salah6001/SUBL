using Domain.Habits;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Habits;

internal sealed class HabitConfiguration : IEntityTypeConfiguration<Habit>
{
    public void Configure(EntityTypeBuilder<Habit> builder)
    {
        builder.ToTable("habits");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.UserId)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(h => h.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(h => h.Label)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(h => h.Category)
            .IsRequired();

        builder.Property(h => h.Icon)
            .HasMaxLength(50);

        builder.Property(h => h.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(h => h.CreatedAt)
            .IsRequired();

        builder.HasIndex(h => new { h.UserId, h.IsActive });

        builder.HasMany(h => h.Completions)
            .WithOne(c => c.Habit)
            .HasForeignKey(c => c.HabitId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class HabitCompletionConfiguration : IEntityTypeConfiguration<HabitCompletion>
{
    public void Configure(EntityTypeBuilder<HabitCompletion> builder)
    {
        builder.ToTable("habit_completions");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.HabitId)
            .IsRequired();

        builder.Property(c => c.UserId)
            .IsRequired();

        builder.Property(c => c.Date)
            .IsRequired();

        builder.Property(c => c.CompletedAt)
            .IsRequired();

        // One completion row per habit per day.
        builder.HasIndex(c => new { c.HabitId, c.Date })
            .IsUnique();

        builder.HasIndex(c => new { c.UserId, c.Date });
    }
}
