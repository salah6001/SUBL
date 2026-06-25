using Domain.Articles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Articles;

internal sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("articles");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(a => a.Author)
            .HasMaxLength(120);

        builder.Property(a => a.AuthorRole)
            .HasMaxLength(120);

        builder.Property(a => a.ReadTime)
            .HasMaxLength(40);

        builder.Property(a => a.Category)
            .IsRequired();

        builder.Property(a => a.Image)
            .HasMaxLength(1000);

        builder.Property(a => a.Excerpt)
            .HasMaxLength(500);

        builder.Property(a => a.Content)
            .HasColumnType("text")
            .IsRequired();

        builder.Property(a => a.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasIndex(a => new { a.IsPublished, a.Category });
    }
}
