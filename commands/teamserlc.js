const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../Config");

// Node 16
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("erlcteams")
        .setDescription("Shows a list of all in-game players and their team."),

    run: async (interaction, client) => {
        try {
            await interaction.deferReply();

            const url = config.erlc.baseUrl + config.erlc.endpoints.v1.players;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "server-key": config.erlc.apiKey,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                return interaction.editReply(`❌ V1 API Error (${response.status})`);
            }

            const rawText = await response.text();
            const data = JSON.parse(rawText);

            if (!data || data.length === 0) {
                return interaction.editReply("❌ No players currently in-game.");
            }

            const teams = {
                sheriff: [],
                police: [],
                fire: [],
                transport: [],
                civilian: []
            };

            data.forEach(player => {
                const team = (player.Team || "").toLowerCase();

                const entry =
                    `**${player.Player}**` +
                    ` | ${player.Callsign ? player.Callsign : "No Callsign"}`;

                if (team.includes("sheriff")) teams.sheriff.push(entry);
                else if (team.includes("police")) teams.police.push(entry);
                else if (team.includes("fire")) teams.fire.push(entry);
                else if (team.includes("transport") || team.includes("dot")) teams.transport.push(entry);
                else teams.civilian.push(entry);
            });

            const createEmbed = (title, players, color) => {
                const list = players.length > 0
                    ? players.join("\n")
                    : "No active users on this team.";

                return new EmbedBuilder()
                    .setTitle(title)
                    .setColor(color)
                    .setDescription(
                        `# Team Count: ${players.length}\n` +
                        `----Players----\n${list}`
                    )
                    .setFooter({ text: "New York Utils V2" })
                    .setTimestamp();
            };

            const sheriffEmbed = createEmbed("WL Team", teams.sheriff, 0xFFFF00);
            const policeEmbed = createEmbed("NYPD", teams.police, 0x4169FF);
            const fireEmbed = createEmbed("FDNY", teams.fire, 0xFF0000);
            const transportEmbed = createEmbed("DOT", teams.transport, 0xFFA500);
            const civEmbed = createEmbed("Civilian", teams.civilian, 0xFFFFFF);

            await interaction.editReply({
                embeds: [sheriffEmbed, policeEmbed, fireEmbed, transportEmbed, civEmbed]
            });

        } catch (error) {
            interaction.editReply("❌ Something went wrong while contacting ERLC V1.");
        }
    }
};
