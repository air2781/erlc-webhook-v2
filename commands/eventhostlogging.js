const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "../others/eventhostlogs.json");
const LOG_CHANNEL = "1325111132645757038";

const ALLOWED_ROLES = [
    "1410821162564452383",
    "1290085306619396181",
    "1460517136241004574",
    "1314418348729040946"
];

function loadData() {
    if (!fs.existsSync(FILE_PATH)) return { logs: [] };
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// Generate unique 4-digit code
function generateID(existingIDs) {
    let id;
    do {
        id = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existingIDs.includes(id));
    return id;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventlogcreation")
        .setDescription("Create an event log entry")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Name of the event (Purge, TDM, etc)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("hosts")
                .setDescription("Mention all hosts/co-hosts")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("Event duration or end time")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("required")
                .setDescription("Is participation required?")
                .addChoices(
                    { name: "Yes", value: "Yes" },
                    { name: "No", value: "No" }
                )
                .setRequired(false))
        .addStringOption(option =>
            option.setName("permissionby")
                .setDescription("User(s) who gave permission")
                .setRequired(false)),

    run: async (interaction, client) => {
        try {
            const member = await interaction.guild.members.fetch(interaction.user.id);

            const allowed =
                member.permissions.has(8) || // Admin
                member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

            if (!allowed) {
                return interaction.reply({
                    content: "❌ You are not authorized to use this command.",
                    ephemeral: true
                });
            }

            const name = interaction.options.getString("name");
            const hosts = interaction.options.getString("hosts");
            const duration = interaction.options.getString("duration");
            const required = interaction.options.getString("required") || "Not Specified";
            const permissionBy = interaction.options.getString("permissionby") || "None";

            const data = loadData();

            const eventID = generateID(data.logs.map(e => e.id));

            const logEntry = {
                id: eventID,
                eventName: name,
                hosts: hosts,
                duration: duration,
                required: required,
                permissionBy: permissionBy,
                createdBy: interaction.user.tag,
                userId: interaction.user.id,
                timestamp: new Date().toISOString()
            };

            data.logs.push(logEntry);
            saveData(data);

            const logEmbed = new EmbedBuilder()
                .setTitle(`Event Log: ${eventID}`)
                .setDescription(
`**Event:** ${name}
**Hosts:** ${hosts}
**Duration:** ${duration}
**Required:** ${required}
**Permission By:** ${permissionBy}`
                )
                .setFooter({ text: `${interaction.user.tag} logged this event.` })
                .setColor(0xFFFF00)
                .setTimestamp();

            const logChannel = await client.channels.fetch(LOG_CHANNEL);
            if (logChannel) {
                // First a normal message
                await logChannel.send(`EVENT LOG: ${eventID}`);
                // Then the embed
                await logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.reply({
                content: `<:Check:1478581031971061983> Event log **${eventID}** created successfully. View game-logs channel for the log.`,
                ephemeral: true
            });

        } catch (err) {
            console.error("Event log command error:", err);
        }
    }
};