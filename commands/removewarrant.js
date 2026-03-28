const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const WARRANT_LOG_PATH = path.join(__dirname, "../warrantlogs.json");

const ALLOWED_ROLES = [
    "1290085306489639026",
    "1313304471937220708",
    "1330398732679643296"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removewarrant")
        .setDescription("Remove a warrant by Roblox username")
        .addStringOption(opt =>
            opt.setName("username")
                .setDescription("Roblox Username")
                .setRequired(true)
        ),

    run: async (interaction) => {

        const memberRoles = interaction.member.roles.cache.map(r => r.id);
        const hasPerm = interaction.member.permissions.has("Administrator") ||
            memberRoles.some(r => ALLOWED_ROLES.includes(r));

        if (!hasPerm)
            return interaction.reply({
                content: "❌ You do not have permission.",
                ephemeral: true
            });

        if (!fs.existsSync(WARRANT_LOG_PATH))
            return interaction.reply({
                content: "No warrant log file found.",
                ephemeral: true
            });

        const username = interaction.options.getString("username").toLowerCase();
        const warrants = JSON.parse(fs.readFileSync(WARRANT_LOG_PATH, "utf-8"));

        const index = warrants.findIndex(
            w => w.username.toLowerCase() === username
        );

        if (index === -1) {
            return interaction.reply({
                content: "<:ErrorX:1473547704444653568> No warrant found for that username.",
                ephemeral: true
            });
        }

        const removed = warrants[index];
        warrants.splice(index, 1);

        fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify(warrants, null, 2));

        return interaction.reply({
            content: `<:Check:1478581031971061983> Warrant for **${removed.username}** has been removed.`,
        });
    }
};