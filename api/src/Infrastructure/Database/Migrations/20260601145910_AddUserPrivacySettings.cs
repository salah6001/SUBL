using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPrivacySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_privacy_settings",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    keystroke_dynamics = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    sentiment_analysis = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    product_analytics = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    employer_data_sharing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_privacy_settings", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_privacy_settings_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_user_privacy_settings_user_id",
                schema: "public",
                table: "user_privacy_settings",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_privacy_settings",
                schema: "public");
        }
    }
}
