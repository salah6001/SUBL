using System;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260621120000_AddDeviceClaiming")]
    public partial class AddDeviceClaiming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "claimed_by_user_id",
                schema: "public",
                table: "devices",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_devices_claimed_by_user_id",
                schema: "public",
                table: "devices",
                column: "claimed_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_devices_claimed_by_user_id",
                schema: "public",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "claimed_by_user_id",
                schema: "public",
                table: "devices");
        }
    }
}
