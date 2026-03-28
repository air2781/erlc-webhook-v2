const fs = require("fs");
const path = require("path");
const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const {
  sendTicketQuotaEmbed
} = require("../others/ticketQuotaLogger");

const LOG_PATH = path.join(__dirname, "../Ticketslog.json");

// Allowed roles
const ALLOWED_ROLES = [
  "1290085306619396181",
  "1314418348729040946"
];

// ⛔ Lock per channel
const lockedChannels = new Set();

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, JSON.stringify({}, null, 2));
  }

  const raw = fs.readFileSync(LOG_PATH, "utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("handled")
    .setDescription("Log a handled ticket")
    .addStringOption(opt =>
      opt
        .setName("message_id")
        .setDescription("Message ID of the ticket")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("type")
        .setDescription("Type of ticket")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("reason")
        .setDescription("Reason for handling")
        .setRequired(true)
    ),

  async run(interaction, client) {
    const member = interaction.member;

    // 🔒 Permission check
    const allowed =
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

    if (!allowed) return;

    // ⛔ Channel already handled
    if (lockedChannels.has(interaction.channel.id)) return;

    const messageId = interaction.options.getString("message_id");
    const ticketType = interaction.options.getString("type");
    const reason = interaction.options.getString("reason");

    // ⛔ Length limits
    if (ticketType.length > 300 || reason.length > 300) {
      return interaction.reply({
        content: "Each input must be 300 characters or less.",
        ephemeral: true
      });
    }

    // Fetch target message
    const targetMessage = await interaction.channel.messages
      .fetch(messageId)
      .catch(() => null);

    if (!targetMessage) {
      return interaction.reply({
        content: "Invalid ticket.",
        ephemeral: true
      });
    }

    // ✅ Must contain embed
    if (!targetMessage.embeds || targetMessage.embeds.length === 0) {
      return interaction.reply({
        content: "Invalid ticket.",
        ephemeral: true
      });
    }

    // 🔒 Lock channel
    lockedChannels.add(interaction.channel.id);

    const loggingMsg = await interaction.reply({
      content: "📊 Logging...",
      fetchReply: true
    });

    // Update quota log (NUMBER BASED)
    const data = loadLog();
    const userId = interaction.user.id;

    if (typeof data[userId] !== "number") {
      data[userId] = 0;
    }

    data[userId] += 1;
    saveLog(data);

    // 📤 Send quota embed
    await sendTicketQuotaEmbed(
      client,
      interaction.guild,
      interaction.user,
      ticketType,
      reason,
      interaction.channel.name
    );

    await interaction.editReply("<:Check:1478581031971061983> **Ticket successfully logged.**");

    // 🧹 Auto delete after 10 seconds
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch {}
    }, 10_000);
  }
};
