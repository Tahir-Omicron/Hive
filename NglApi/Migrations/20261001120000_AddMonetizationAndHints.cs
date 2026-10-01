using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NglApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMonetizationAndHints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Coins",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 50);

            migrationBuilder.AddColumn<bool>(
                name: "IsPro",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DeviceHint",
                table: "Messages",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LocationHint",
                table: "Messages",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UniversityHint",
                table: "Messages",
                type: "TEXT",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SenderInitialHint",
                table: "Messages",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ClueLevelRevealed",
                table: "Messages",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Coins",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPro",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeviceHint",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "LocationHint",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "UniversityHint",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "SenderInitialHint",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ClueLevelRevealed",
                table: "Messages");
        }
    }
}
