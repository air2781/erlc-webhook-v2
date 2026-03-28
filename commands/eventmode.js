const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../Config");

const EVENT_FILE = path.join(__dirname, "../eventfunctionmode.json");

const ALLOWED_ROLES = [
    "1460492911631405220",
    "1460517136241004574",
    "1290085306619396181",
    "1410821162564452383"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventmode")
        .setDescription("Activate event-mode in-game, which disables all in-game environments to allow custom settings.")
        .addBooleanOption(option =>
            option.setName("state")
                .setDescription("Enable or disable event mode")
                .setRequired(true)
        ),

    run: async (interaction) => {

        try {

            const member = interaction.member;

            const hasRole = member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));
            const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

            if (!hasRole && !isAdmin) {
                return interaction.reply({
                    content: "❌ You do not have permission to use this command.",
                    ephemeral: true
                });
            }

            const state = interaction.options.getBoolean("state");

            fs.writeFileSync(EVENT_FILE, JSON.stringify({
                enabled: state
            }, null, 2));

            await interaction.reply(`⚙️ Event mode set to **${state}**. Applying in 10 seconds...`);

            setTimeout(async () => {

                try {

                    const message = state
                        ? ":h Server adjusting to event mode... an event will soon be hosted or is being hosted at this time."
                        : ":h Server is returning to normal settings...";

                    await fetch("https://api.policeroleplay.community/v1/server/command", {
                        method: "POST",
                        headers: {
                            "server-key": config.erlc.apiKey,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            command: message
                        })
                    });

                } catch (err) {
                    console.error("Failed sending event H message:", err);
                }

            }, 9000);

        } catch (err) {
            console.error("Eventmode command error:", err);
        }

    }
};