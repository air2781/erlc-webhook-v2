const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Returns bot latency"),
    run: async (interaction, client) => {
        try {
            const latency = Date.now() - interaction.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);

            let emoji;
            if (latency < 100) emoji = "<:Check:1478581031971061983>";
            else if (latency < 200) emoji = "<:Check:1478581031971061983>";
            else emoji = "<:Check:1473547604921942046>";

            await interaction.reply({ content: `${emoji} Pong! Latency: ${latency}ms | API: ${apiLatency}ms` });
        } catch (err) {
            console.error("Ping command error:", err);
        }
    }
};
