const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../Config");

// Node 16 only
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ingameplayers")
        .setDescription("Shows all players currently in-game (ER:LC V1)"),

    run: async (interaction, client) => {
        try {
            await interaction.deferReply();

            // V1 URL
            const url = config.erlc.baseUrl + config.erlc.endpoints.v1.players;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "server-key": config.erlc.apiKey, // ✅ V1 requires server-key
                    "Accept": "application/json"
                }
            });

            console.log("V1 Status:", response.status);
            const rawText = await response.text();
            console.log("V1 Response:", rawText);

            if (!response.ok) {
                return interaction.editReply(`❌ V1 API Error (${response.status})`);
            }

            const data = JSON.parse(rawText);

            if (!data || data.length === 0) {
                return interaction.editReply("<:Check:1473547604921942046> No players are currently in-game.");
            }

            const formattedPlayers = data.map(player => {
                return `**${player.Player}** — ${player.Team || "Unknown"} ${player.Callsign ? `(${player.Callsign})` : ""}`;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🚓 In-Game Players (V1)")
                .setDescription(formattedPlayers)
                .setColor(0x2b2d31)
                .setFooter({ text: `Total Players: ${data.length}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("V1 InGamePlayer command error:", error);
            interaction.editReply("❌ Something went wrong while contacting ERLC V1.");
        }
    }
};