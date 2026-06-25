using Domain.Surveys;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Surveys;

internal sealed class SurveyQuestionConfiguration : IEntityTypeConfiguration<SurveyQuestion>
{
    public void Configure(EntityTypeBuilder<SurveyQuestion> builder)
    {
        builder.ToTable("survey_questions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Text)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(q => q.Category)
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(q => q.Order)
            .IsRequired();

        builder.Property(q => q.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // System-managed PSS-style questions seeded with stable ids.
        builder.HasData(
            new { Id = new Guid("11111111-1111-1111-1111-111111111111"), Text = "How often have you felt unable to control important things in your work life this week?", Category = "Control", Order = 1, IsActive = true },
            new { Id = new Guid("22222222-2222-2222-2222-222222222222"), Text = "How frequently have you felt nervous, anxious, or on edge during your workday?", Category = "Anxiety", Order = 2, IsActive = true },
            new { Id = new Guid("33333333-3333-3333-3333-333333333333"), Text = "How often have you found difficulty concentrating on tasks?", Category = "Focus", Order = 3, IsActive = true },
            new { Id = new Guid("44444444-4444-4444-4444-444444444444"), Text = "How frequently have you experienced physical symptoms (headache, tight shoulders)?", Category = "Physical", Order = 4, IsActive = true },
            new { Id = new Guid("55555555-5555-5555-5555-555555555555"), Text = "How often have you felt difficulties were piling up so high you could not cope?", Category = "Overwhelm", Order = 5, IsActive = true });
    }
}

internal sealed class SurveyResponseConfiguration : IEntityTypeConfiguration<SurveyResponse>
{
    public void Configure(EntityTypeBuilder<SurveyResponse> builder)
    {
        builder.ToTable("survey_responses");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.UserId)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.SubmittedAt)
            .IsRequired();

        builder.Property(r => r.TotalScore)
            .IsRequired();

        builder.Property(r => r.Level)
            .IsRequired();

        builder.HasMany(r => r.Answers)
            .WithOne()
            .HasForeignKey(a => a.ResponseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.UserId, r.SubmittedAt });
    }
}

internal sealed class SurveyAnswerConfiguration : IEntityTypeConfiguration<SurveyAnswer>
{
    public void Configure(EntityTypeBuilder<SurveyAnswer> builder)
    {
        builder.ToTable("survey_answers");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ResponseId)
            .IsRequired();

        builder.Property(a => a.QuestionId)
            .IsRequired();

        builder.Property(a => a.Value)
            .IsRequired();

        builder.HasOne<SurveyQuestion>()
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
