using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddStressDetectionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lead_stage_history",
                schema: "public");

            migrationBuilder.DropTable(
                name: "proposal_activities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "proposal_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "leads",
                schema: "public");

            migrationBuilder.DropTable(
                name: "proposals",
                schema: "public");

            migrationBuilder.DropTable(
                name: "services",
                schema: "public");

            migrationBuilder.DropTable(
                name: "lead_sources",
                schema: "public");

            migrationBuilder.DropTable(
                name: "lost_reasons",
                schema: "public");

            migrationBuilder.DropTable(
                name: "pipeline_stages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "service_categories",
                schema: "public");

            migrationBuilder.RenameColumn(
                name: "portal_access_enabled",
                schema: "public",
                table: "account_settings",
                newName: "dashboard_access_enabled");

            migrationBuilder.RenameColumn(
                name: "max_contacts",
                schema: "public",
                table: "account_settings",
                newName: "max_employees");

            migrationBuilder.RenameColumn(
                name: "max_active_projects",
                schema: "public",
                table: "account_settings",
                newName: "max_monitored_users");

            migrationBuilder.RenameColumn(
                name: "allow_contact_self_invite",
                schema: "public",
                table: "account_settings",
                newName: "allow_employee_self_invite");

            migrationBuilder.RenameColumn(
                name: "can_view_projects",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_stress_data");

            migrationBuilder.RenameColumn(
                name: "can_view_invoices",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_reports");

            migrationBuilder.RenameColumn(
                name: "can_view_financials",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_analytics");

            migrationBuilder.RenameColumn(
                name: "can_view_contracts",
                schema: "public",
                table: "account_contacts",
                newName: "can_manage_suggestions");

            migrationBuilder.RenameColumn(
                name: "can_approve_deliverables",
                schema: "public",
                table: "account_contacts",
                newName: "can_export_data");

            migrationBuilder.CreateTable(
                name: "devices",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    device_fingerprint = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    os_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    agent_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_seen_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_devices", x => x.id);
                    table.ForeignKey(
                        name: "fk_devices_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "plans",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    monthly_price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    yearly_price = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    max_users = table.Column<int>(type: "integer", nullable: false),
                    data_retention_days = table.Column<int>(type: "integer", nullable: false),
                    has_realtime_alerts = table.Column<bool>(type: "boolean", nullable: false),
                    has_weekly_reports = table.Column<bool>(type: "boolean", nullable: false),
                    has_export = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stress_sessions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_activity_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    metrics_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    readings_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    average_stress_score = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    peak_stress_score = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    end_reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_stress_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_stress_sessions_devices_device_id",
                        column: x => x.device_id,
                        principalSchema: "public",
                        principalTable: "devices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_stress_sessions_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_cycle = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscriptions_accounts_account_id",
                        column: x => x.account_id,
                        principalSchema: "public",
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_subscriptions_plans_plan_id",
                        column: x => x.plan_id,
                        principalSchema: "public",
                        principalTable: "plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "keyboard_metrics",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mean_dwell = table.Column<double>(type: "double precision", nullable: false),
                    median_flight = table.Column<double>(type: "double precision", nullable: false),
                    cv_flight = table.Column<double>(type: "double precision", nullable: false),
                    mean_del_freq = table.Column<double>(type: "double precision", nullable: false),
                    mean_tot_time = table.Column<double>(type: "double precision", nullable: false),
                    n_keys = table.Column<int>(type: "integer", nullable: false),
                    delete_count = table.Column<int>(type: "integer", nullable: true),
                    captured_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_keyboard_metrics", x => x.id);
                    table.ForeignKey(
                        name: "fk_keyboard_metrics_stress_sessions_session_id",
                        column: x => x.session_id,
                        principalSchema: "public",
                        principalTable: "stress_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscription_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    currency_code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    issued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_invoices", x => x.id);
                    table.ForeignKey(
                        name: "fk_invoices_subscriptions_subscription_id",
                        column: x => x.subscription_id,
                        principalSchema: "public",
                        principalTable: "subscriptions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "stress_readings",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metrics_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    score = table.Column<double>(type: "double precision", nullable: false),
                    level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    confidence = table.Column<double>(type: "double precision", nullable: false),
                    model_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_stress_readings", x => x.id);
                    table.ForeignKey(
                        name: "fk_stress_readings_keyboard_metrics_metrics_id",
                        column: x => x.metrics_id,
                        principalSchema: "public",
                        principalTable: "keyboard_metrics",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_stress_readings_stress_sessions_session_id",
                        column: x => x.session_id,
                        principalSchema: "public",
                        principalTable: "stress_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_devices_user_id_device_fingerprint",
                schema: "public",
                table: "devices",
                columns: new[] { "user_id", "device_fingerprint" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_devices_user_id_is_active",
                schema: "public",
                table: "devices",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_invoices_account_id",
                schema: "public",
                table: "invoices",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_invoices_invoice_number",
                schema: "public",
                table: "invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invoices_subscription_id",
                schema: "public",
                table: "invoices",
                column: "subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_keyboard_metrics_session_id_received_at",
                schema: "public",
                table: "keyboard_metrics",
                columns: new[] { "session_id", "received_at" });

            migrationBuilder.CreateIndex(
                name: "ix_plans_name",
                schema: "public",
                table: "plans",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_stress_readings_metrics_id",
                schema: "public",
                table: "stress_readings",
                column: "metrics_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_stress_readings_session_id_created_at",
                schema: "public",
                table: "stress_readings",
                columns: new[] { "session_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_stress_readings_user_id_created_at",
                schema: "public",
                table: "stress_readings",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_stress_readings_user_id_level_created_at",
                schema: "public",
                table: "stress_readings",
                columns: new[] { "user_id", "level", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_stress_sessions_device_id",
                schema: "public",
                table: "stress_sessions",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "ix_stress_sessions_user_id_started_at",
                schema: "public",
                table: "stress_sessions",
                columns: new[] { "user_id", "started_at" });

            migrationBuilder.CreateIndex(
                name: "ix_stress_sessions_user_id_status",
                schema: "public",
                table: "stress_sessions",
                columns: new[] { "user_id", "status" },
                filter: "status IN ('Active', 'Paused')");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_account_id",
                schema: "public",
                table: "subscriptions",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_plan_id",
                schema: "public",
                table: "subscriptions",
                column: "plan_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "invoices",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stress_readings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "subscriptions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "keyboard_metrics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "plans",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stress_sessions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "devices",
                schema: "public");

            migrationBuilder.RenameColumn(
                name: "max_monitored_users",
                schema: "public",
                table: "account_settings",
                newName: "max_active_projects");

            migrationBuilder.RenameColumn(
                name: "max_employees",
                schema: "public",
                table: "account_settings",
                newName: "max_contacts");

            migrationBuilder.RenameColumn(
                name: "dashboard_access_enabled",
                schema: "public",
                table: "account_settings",
                newName: "portal_access_enabled");

            migrationBuilder.RenameColumn(
                name: "allow_employee_self_invite",
                schema: "public",
                table: "account_settings",
                newName: "allow_contact_self_invite");

            migrationBuilder.RenameColumn(
                name: "can_view_stress_data",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_projects");

            migrationBuilder.RenameColumn(
                name: "can_view_reports",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_invoices");

            migrationBuilder.RenameColumn(
                name: "can_view_analytics",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_financials");

            migrationBuilder.RenameColumn(
                name: "can_manage_suggestions",
                schema: "public",
                table: "account_contacts",
                newName: "can_view_contracts");

            migrationBuilder.RenameColumn(
                name: "can_export_data",
                schema: "public",
                table: "account_contacts",
                newName: "can_approve_deliverables");

            migrationBuilder.CreateTable(
                name: "lead_sources",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lead_sources", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "lost_reasons",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lost_reasons", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "pipeline_stages",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    is_final = table.Column<bool>(type: "boolean", nullable: false),
                    is_won_stage = table.Column<bool>(type: "boolean", nullable: false),
                    max_days_allowed = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pipeline_stages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "proposals",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_to_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    contact_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    discount_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    discount_type = table.Column<int>(type: "integer", nullable: false),
                    discount_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    internal_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    proposal_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    rejection_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    sub_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    tax_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    terms = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    valid_until = table.Column<DateOnly>(type: "date", nullable: false),
                    viewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proposals", x => x.id);
                    table.ForeignKey(
                        name: "fk_proposals_account_contacts_contact_id",
                        column: x => x.contact_id,
                        principalSchema: "public",
                        principalTable: "account_contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proposals_accounts_account_id",
                        column: x => x.account_id,
                        principalSchema: "public",
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_proposals_users_assigned_to_user_id",
                        column: x => x.assigned_to_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_proposals_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "service_categories",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_categories", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_categories_service_categories_parent_category_id",
                        column: x => x.parent_category_id,
                        principalSchema: "public",
                        principalTable: "service_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "leads",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_to_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    converted_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    current_stage_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lost_reason_id = table.Column<Guid>(type: "uuid", nullable: true),
                    source_id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    contact_person = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    estimated_budget_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    estimated_budget_currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    industry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_activity_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    lead_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    lost_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    next_action_date = table.Column<DateOnly>(type: "date", nullable: false),
                    next_action_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    next_action_type = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    stage_entered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_leads", x => x.id);
                    table.ForeignKey(
                        name: "fk_leads_accounts_converted_account_id",
                        column: x => x.converted_account_id,
                        principalSchema: "public",
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_leads_lead_sources_source_id",
                        column: x => x.source_id,
                        principalSchema: "public",
                        principalTable: "lead_sources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_leads_lost_reasons_lost_reason_id",
                        column: x => x.lost_reason_id,
                        principalSchema: "public",
                        principalTable: "lost_reasons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_leads_pipeline_stages_current_stage_id",
                        column: x => x.current_stage_id,
                        principalSchema: "public",
                        principalTable: "pipeline_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_leads_users_assigned_to_user_id",
                        column: x => x.assigned_to_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_leads_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "proposal_activities",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    proposal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    activity_type = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    performed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    performed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proposal_activities", x => x.id);
                    table.ForeignKey(
                        name: "fk_proposal_activities_proposals_proposal_id",
                        column: x => x.proposal_id,
                        principalSchema: "public",
                        principalTable: "proposals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "services",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_taxable = table.Column<bool>(type: "boolean", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    tax_rate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    default_price_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    default_price_currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_services", x => x.id);
                    table.ForeignKey(
                        name: "fk_services_service_categories_category_id",
                        column: x => x.category_id,
                        principalSchema: "public",
                        principalTable: "service_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lead_stage_history",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_stage_id = table.Column<Guid>(type: "uuid", nullable: true),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    to_stage_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lead_stage_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_lead_stage_history_leads_lead_id",
                        column: x => x.lead_id,
                        principalSchema: "public",
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_lead_stage_history_pipeline_stages_from_stage_id",
                        column: x => x.from_stage_id,
                        principalSchema: "public",
                        principalTable: "pipeline_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_lead_stage_history_pipeline_stages_to_stage_id",
                        column: x => x.to_stage_id,
                        principalSchema: "public",
                        principalTable: "pipeline_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_lead_stage_history_users_changed_by_user_id",
                        column: x => x.changed_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "proposal_items",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    proposal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    discount_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    discount_type = table.Column<int>(type: "integer", nullable: false),
                    discount_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    is_taxable = table.Column<bool>(type: "boolean", nullable: false),
                    line_total = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    tax_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    tax_rate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proposal_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_proposal_items_proposals_proposal_id",
                        column: x => x.proposal_id,
                        principalSchema: "public",
                        principalTable: "proposals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_proposal_items_services_service_id",
                        column: x => x.service_id,
                        principalSchema: "public",
                        principalTable: "services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_lead_sources_is_active",
                schema: "public",
                table: "lead_sources",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_lead_sources_name",
                schema: "public",
                table: "lead_sources",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_lead_stage_history_changed_at",
                schema: "public",
                table: "lead_stage_history",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "ix_lead_stage_history_changed_by_user_id",
                schema: "public",
                table: "lead_stage_history",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_lead_stage_history_from_stage_id",
                schema: "public",
                table: "lead_stage_history",
                column: "from_stage_id");

            migrationBuilder.CreateIndex(
                name: "ix_lead_stage_history_lead_id",
                schema: "public",
                table: "lead_stage_history",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "ix_lead_stage_history_to_stage_id",
                schema: "public",
                table: "lead_stage_history",
                column: "to_stage_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_assigned_to_user_id",
                schema: "public",
                table: "leads",
                column: "assigned_to_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_converted_account_id",
                schema: "public",
                table: "leads",
                column: "converted_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_created_at",
                schema: "public",
                table: "leads",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_leads_created_by_user_id",
                schema: "public",
                table: "leads",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_current_stage_id",
                schema: "public",
                table: "leads",
                column: "current_stage_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_current_stage_id_stage_entered_at",
                schema: "public",
                table: "leads",
                columns: new[] { "current_stage_id", "stage_entered_at" });

            migrationBuilder.CreateIndex(
                name: "ix_leads_lead_number",
                schema: "public",
                table: "leads",
                column: "lead_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_leads_lost_reason_id",
                schema: "public",
                table: "leads",
                column: "lost_reason_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_next_action_date",
                schema: "public",
                table: "leads",
                column: "next_action_date");

            migrationBuilder.CreateIndex(
                name: "ix_leads_source_id",
                schema: "public",
                table: "leads",
                column: "source_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_status",
                schema: "public",
                table: "leads",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_lost_reasons_is_active",
                schema: "public",
                table: "lost_reasons",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_lost_reasons_name",
                schema: "public",
                table: "lost_reasons",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_pipeline_stages_code",
                schema: "public",
                table: "pipeline_stages",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pipeline_stages_is_active",
                schema: "public",
                table: "pipeline_stages",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_pipeline_stages_is_default",
                schema: "public",
                table: "pipeline_stages",
                column: "is_default");

            migrationBuilder.CreateIndex(
                name: "ix_pipeline_stages_sort_order",
                schema: "public",
                table: "pipeline_stages",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "ix_proposal_activities_activity_type",
                schema: "public",
                table: "proposal_activities",
                column: "activity_type");

            migrationBuilder.CreateIndex(
                name: "ix_proposal_activities_performed_at",
                schema: "public",
                table: "proposal_activities",
                column: "performed_at");

            migrationBuilder.CreateIndex(
                name: "ix_proposal_activities_proposal_id",
                schema: "public",
                table: "proposal_activities",
                column: "proposal_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposal_items_proposal_id",
                schema: "public",
                table: "proposal_items",
                column: "proposal_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposal_items_proposal_id_sort_order",
                schema: "public",
                table: "proposal_items",
                columns: new[] { "proposal_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_proposal_items_service_id",
                schema: "public",
                table: "proposal_items",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_account_id",
                schema: "public",
                table: "proposals",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_assigned_to_user_id",
                schema: "public",
                table: "proposals",
                column: "assigned_to_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_contact_id",
                schema: "public",
                table: "proposals",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_created_at",
                schema: "public",
                table: "proposals",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_created_by_user_id",
                schema: "public",
                table: "proposals",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_proposal_number",
                schema: "public",
                table: "proposals",
                column: "proposal_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_proposals_status",
                schema: "public",
                table: "proposals",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_proposals_valid_until",
                schema: "public",
                table: "proposals",
                column: "valid_until");

            migrationBuilder.CreateIndex(
                name: "ix_service_categories_is_active",
                schema: "public",
                table: "service_categories",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_service_categories_name",
                schema: "public",
                table: "service_categories",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_service_categories_parent_category_id",
                schema: "public",
                table: "service_categories",
                column: "parent_category_id");

            migrationBuilder.CreateIndex(
                name: "ix_service_categories_sort_order",
                schema: "public",
                table: "service_categories",
                column: "sort_order");

            migrationBuilder.CreateIndex(
                name: "ix_services_category_id",
                schema: "public",
                table: "services",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_services_code",
                schema: "public",
                table: "services",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_services_created_by_user_id",
                schema: "public",
                table: "services",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_services_name",
                schema: "public",
                table: "services",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_services_status",
                schema: "public",
                table: "services",
                column: "status");
        }
    }
}
