const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "Eventlogs.json");


const ALLOWED_IDS = [
  "1314418348729040946",
  "1460517136241004574",
  "1290085306619396181"
];

const LOGS_PER_PAGE = 5;
const MAX_PAGES = 8;
const cooldowns = new Map();

function loadEvents() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function saveEvents(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "eventlogs",

  run: async (client, message) => {
    const allowed =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.some(r => ALLOWED_IDS.includes(r.id));

    if (!allowed) return;

    // ⏱️ COMMAND COOLDOWN (2s)
    const now = Date.now();
    if (cooldowns.has(message.author.id) && now - cooldowns.get(message.author.id) < 2000) return;
    cooldowns.set(message.author.id, now);

    let events = loadEvents();

    // 🧹 PURGE OLD LOGS IF TOO MANY PAGES
    const totalPages = Math.ceil(events.length / LOGS_PER_PAGE);
    if (totalPages > MAX_PAGES) {
      const purgeAmount = LOGS_PER_PAGE * 2; // remove first 2 pages
      events.splice(0, purgeAmount);
      saveEvents(events);
    }

    if (events.length === 0) {
      return message.channel.send("⚠️ No event logs available.");
    }

    let page = 1;

    const buildEmbed = (pageNum) => {
      const start = (pageNum - 1) * LOGS_PER_PAGE;
      const logs = events.slice(start, start + LOGS_PER_PAGE);

      return new EmbedBuilder()
        .setTitle("Event Logs")
        .setColor("Yellow")
        .setDescription(
          `> The following below are the registered and logged events. Each might be missing specific information, so it's best to ask the person who logged it.\n\n` +
          logs.map(e =>
            `> **Host:** <@${e.createdBy}>\n` +
            `> **Name of Event:** ${e.title}\n` +
            `> **Expected Participators:** ${e.expected}\n` +
            `> **Date:** <t:${Math.floor(e.createdAt / 1000)}:F>\n` +
            `-------------------------`
          ).join("\n")
        )
        .setFooter({
          text: `Page ${pageNum}/${Math.ceil(events.length / LOGS_PER_PAGE)} | Today at ${new Date().toLocaleTimeString()}`
        });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("event_prev")
        .setLabel("Previous Page")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("event_next")
        .setLabel("Next Page")
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.channel.send({
      embeds: [buildEmbed(page)],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 10 * 60 * 1000 });

    collector.on("collect", async interaction => {
      const allowedUser =
        interaction.member.permissions.has("Administrator") ||
        interaction.member.roles.cache.some(r => ALLOWED_IDS.includes(r.id));

      if (!allowedUser) {
        return interaction.reply({ content: "❌ You cannot use these buttons.", ephemeral: true });
      }

      // ⏱️ BUTTON COOLDOWN (2s)
      const now = Date.now();
      if (cooldowns.has(interaction.user.id) && now - cooldowns.get(interaction.user.id) < 2000) {
        return interaction.reply({ content: "⏳ Please wait 2 seconds.", ephemeral: true });
      }
      cooldowns.set(interaction.user.id, now);

      await interaction.deferUpdate();

      const maxPages = Math.ceil(events.length / LOGS_PER_PAGE);

      if (interaction.customId === "event_prev" && page > 1) page--;
      if (interaction.customId === "event_next" && page < maxPages) page++;

      await msg.edit({
        embeds: [buildEmbed(page)],
        components: [row]
      });
    });
  }
};
