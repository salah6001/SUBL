using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddSurveys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "survey_questions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    category = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_survey_questions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "survey_responses",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    total_score = table.Column<int>(type: "integer", nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_survey_responses", x => x.id);
                    table.ForeignKey(
                        name: "fk_survey_responses_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "survey_answers",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    response_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_survey_answers", x => x.id);
                    table.ForeignKey(
                        name: "fk_survey_answers_survey_questions_question_id",
                        column: x => x.question_id,
                        principalSchema: "public",
                        principalTable: "survey_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_survey_answers_survey_responses_response_id",
                        column: x => x.response_id,
                        principalSchema: "public",
                        principalTable: "survey_responses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "survey_questions",
                columns: new[] { "id", "category", "is_active", "order", "text" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Control", true, 1, "How often have you felt unable to control important things in your work life this week?" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Anxiety", true, 2, "How frequently have you felt nervous, anxious, or on edge during your workday?" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Focus", true, 3, "How often have you found difficulty concentrating on tasks?" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "Physical", true, 4, "How frequently have you experienced physical symptoms (headache, tight shoulders)?" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Overwhelm", true, 5, "How often have you felt difficulties were piling up so high you could not cope?" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_survey_answers_question_id",
                schema: "public",
                table: "survey_answers",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "ix_survey_answers_response_id",
                schema: "public",
                table: "survey_answers",
                column: "response_id");

            migrationBuilder.CreateIndex(
                name: "ix_survey_responses_user_id_submitted_at",
                schema: "public",
                table: "survey_responses",
                columns: new[] { "user_id", "submitted_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "survey_answers",
                schema: "public");

            migrationBuilder.DropTable(
                name: "survey_questions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "survey_responses",
                schema: "public");
        }
    }
}
