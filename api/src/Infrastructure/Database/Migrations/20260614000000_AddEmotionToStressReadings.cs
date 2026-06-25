using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddEmotionToStressReadings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "emotion",
                schema: "public",
                table: "stress_readings",
                type: "character varying(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_stress_readings_user_id_emotion_created_at",
                schema: "public",
                table: "stress_readings",
                columns: new[] { "user_id", "emotion", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_stress_readings_user_id_emotion_created_at",
                schema: "public",
                table: "stress_readings");

            migrationBuilder.DropColumn(
                name: "emotion",
                schema: "public",
                table: "stress_readings");
        }
    }
}
