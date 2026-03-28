const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const config = require("../Config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows the current ER:LC server queue"),

    run: async (interaction) => {
        await interaction.deferReply();

        try {
            const res = await fetch(
                `${config.erlc.baseUrl}/v1/server/queue`,
                {
                    headers: {
                        "server-key": config.erlc.apiKey
                    }
                }
            );

            if (!res.ok) {
                return interaction.editReply("Failed to fetch queue.");
            }

            const data = await res.json();

            const queueList = data.Queue || [];

            const embed = new EmbedBuilder()
                .setTitle("ER:LC Server Queue")
                .setColor(0x2b2d31)
                .setDescription(
                    queueList.length === 0
                        ? "No players are currently in queue."
                        : queueList.map((p, i) => `${i + 1}. ${p}`).join("\n")
                )
                .setFooter({ text: `Total in queue: ${queueList.length}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            await interaction.editReply("Error fetching queue.");
        }
    }
};