const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../others/eventhostlogs.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventlogview")
        .setDescription("View event logs by ID or user")
        .addStringOption(option =>
            option.setName("id")
                .setDescription("View a log by event ID")
                .setRequired(false))
        .addUserOption(option =>
            option.setName("user")
                .setDescription("View logs by user who created them")
                .setRequired(false)),

    run: async (interaction, client) => {
        try {
            const id = interaction.options.getString("id");
            const user = interaction.options.getUser("user");

            if (!id && !user) {
                return interaction.reply({
                    content: "❌ You must provide either an ID or a user to view logs.",
                    ephemeral: true
                });
            }

            if (!fs.existsSync(FILE_PATH)) {
                return interaction.reply({
                    content: "❌ No logs exist yet.",
                    ephemeral: true
                });
            }

            const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
            const logs = data.logs || [];

            let logsToSend = [];

            if (id) {
                const log = logs.find(l => l.id === id);
                if (!log) return interaction.reply({ content: `❌ No log found for ID ${id}`, ephemeral: true });
                logsToSend.push(log);
            } else if (user) {
                logsToSend = logs.filter(l => l.userId === user.id);
                if (!logsToSend.length) return interaction.reply({ content: `❌ No logs found for ${user.tag}`, ephemeral: true });
            }

            // Send top warning if multiple logs
            if (logsToSend.length > 1) {
                await interaction.channel.send({
                    content: `**WARNING <@${interaction.user.id}>:** There may be more logs. The bot has only sent recent ones.`
                });
            }

            // Send embeds (limit is 10 per message for safety)
            const chunkSize = 10;
            for (let i = 0; i < logsToSend.length; i += chunkSize) {
                const chunk = logsToSend.slice(i, i + chunkSize);
                const embeds = chunk.map(log => {
                    return new EmbedBuilder()
                        .setTitle(`Event Log: ${log.id}`)
                        .setDescription(
`**Event:** ${log.eventName}
**Hosts:** ${log.hosts}
**Duration:** ${log.duration}
**Required:** ${log.required}
**Permission By:** ${log.permissionBy}`
                        )
                        .setFooter({ text: `${log.createdBy} logged this event.` })
                        .setColor(0xFFFF00)
                        .setTimestamp(new Date(log.timestamp));
                });

                await interaction.channel.send({ embeds });
            }

            await interaction.reply({
                content: `<:Check:1478581031971061983> Event log(s) sent successfully.`,
                ephemeral: true
            });

        } catch (err) {
            console.error("Event log view error:", err);
        }
    }
};