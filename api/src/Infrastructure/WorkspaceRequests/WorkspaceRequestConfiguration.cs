using Domain.WorkspaceRequests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.WorkspaceRequests;

internal sealed class WorkspaceRequestConfiguration : IEntityTypeConfiguration<WorkspaceRequest>
{
    public void Configure(EntityTypeBuilder<WorkspaceRequest> builder)
    {
        builder.ToTable("workspace_requests");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.CompanyName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(w => w.ContactName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(w => w.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(w => w.Message)
            .HasMaxLength(2000);

        builder.Property(w => w.Status)
            .IsRequired();

        builder.Property(w => w.CreatedAt)
            .IsRequired();

        builder.Property(w => w.ReviewNote)
            .HasMaxLength(1000);

        builder.HasIndex(w => w.Status);
    }
}
