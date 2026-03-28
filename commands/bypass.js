const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../blanguage.json");

const ALLOWED_USER = "942789806818213949";
const ALLOWED_ROLES = [
    "1410821162564452383",
    "1290085306619396181",
    "1404979177538715698",
    "1404975343097352304"
];

async function loadData() {
    const file = await fs.promises.readFile(FILE_PATH, "utf8");
    return JSON.parse(file);
}

async function saveData(data) {
    await fs.promises.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bypass")
        .setDescription("Toggle language filter bypass for a user")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to bypass")
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName("value")
                .setDescription("true = bypass, false = remove bypass")
                .setRequired(true)
        ),

    run: async (interaction, client) => {
        try {
            // ✅ FIX: Always fetch member
            const member = await interaction.guild.members.fetch(interaction.user.id);

            const allowed =
                interaction.user.id === ALLOWED_USER ||
                member.roles.cache.some(role => ALLOWED_ROLES.includes(role.id));

            if (!allowed) {
                return interaction.reply({
                    content: "<:X_:1467240500913246461> You are not authorized to use this command.",
                    ephemeral: true
                });
            }

            const target = interaction.options.getUser("user");
            const value = interaction.options.getBoolean("value");

            const data = await loadData();
            if (!data.bypass) data.bypass = {};

            if (value === true) {
                data.bypass[target.id] = true;
            } else {
                delete data.bypass[target.id];
            }

            await saveData(data);

            await interaction.reply({
                content: `<:Check:1478581031971061983> **${target.tag}** bypass set to **${value}**`,
                ephemeral: true
            });
        } catch (err) {
            console.error("Bypass command error:", err);
        }
    }
};
