const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType
} = require("discord.js");

const LOG_PATH = path.join(__dirname, "../Eventlogs.json");
const FINAL_LOG_CHANNEL = "1290085309190504461";

const ALLOWED_ROLES = [
  "1460517136241004574",
  "1290085306619396181",
  "1314418348729040946"
];

// Ensure JSON exists
function loadLogs() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
}

function saveLogs(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "eventcreate",
  aliases: ["ecreate"],

  run: async (client, message) => {
    // 🔒 Permission check
    const allowed =
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

    if (!allowed) return;

    // =========================
    // STEP 1 — EVENT TITLE
    // =========================
    const step1Embed = new EmbedBuilder()
      .setTitle("Event Creation")
      .setColor("Yellow")
      .setDescription(
        `> By running this command, you (**${message.author.username}**) affirm of the creation of this log.\n` +
        `> Please reply to this embed within **25 seconds** including the **title of the event**.\n\n` +
        `**Types of Events:**\n` +
        `> *ER:LC Team Deathmatch, ER:LC Battle Royale, Roblox Hide & Seek, ER:LC Bunker, etc.*`
      );

    const step1Message = await message.channel.send({ embeds: [step1Embed] });

    const step1Collector = message.channel.createMessageCollector({
      filter: m =>
        m.author.id === message.author.id &&
        m.reference?.messageId === step1Message.id,
      time: 25_000,
      max: 1
    });

    step1Collector.on("collect", async reply => {
      step1Collector.stop("done");

      const eventTitleRaw = reply.content.trim();
      const eventTitle = eventTitleRaw.slice(0, 256);

      await step1Message.delete().catch(() => {});
      await reply.delete().catch(() => {});

      startStep2(eventTitle);
    });

    step1Collector.on("end", async (_, reason) => {
      if (reason !== "done") {
        await step1Message.edit({
          content: "> Log failed. Interaction took too long.",
          embeds: []
        }).catch(() => {});
      }
    });

    // =========================
    // STEP 2 — EVENT DETAILS
    // =========================
    async function startStep2(eventTitle) {
      const step2Embed = new EmbedBuilder()
        .setTitle(eventTitle)
        .setColor("Yellow")
        .setDescription(
          `> Title has been put as **${eventTitle}**.\n` +
          `> Please reply to the following questions with each spaced with a space in between.\n` +
          `> If one is not available, put **N/A**.\n\n` +
          `> **[Expected Participators] [Staff Available] [Event Duration] [Max Participators]**`
        );

      const step2Message = await message.channel.send({ embeds: [step2Embed] });

      const step2Collector = message.channel.createMessageCollector({
        filter: m =>
          m.author.id === message.author.id &&
          m.reference?.messageId === step2Message.id,
        time: 60_000,
        max: 1
      });

      step2Collector.on("collect", async reply => {
        step2Collector.stop("done");

        const parts = reply.content.trim().split(/\s+/);
        if (parts.length < 4) {
          await step2Message.edit({
            content: "> Log failed. Invalid format.",
            embeds: []
          });
          return;
        }

        const [expected, staff, duration, max] = parts;

        await step2Message.delete().catch(() => {});
        await reply.delete().catch(() => {});

        startStep3({
          title: eventTitle,
          expected,
          staff,
          duration,
          max
        });
      });

      step2Collector.on("end", async (_, reason) => {
        if (reason !== "done") {
          await step2Message.edit({
            content: "> Log failed. Interaction took too long.",
            embeds: []
          }).catch(() => {});
        }
      });
    }

    // =========================
    // STEP 3 — CONFIRMATION (60s)
    // =========================
    async function startStep3(data) {
      const confirmEmbed = new EmbedBuilder()
        .setTitle("Event Creation")
        .setColor("Yellow")
        .setDescription(
          `> Please confirm everything below is correct.\n` +
          `> If not, do not continue with this log.\n\n` +
          `> **Type of Event:** ${data.title}\n` +
          `> **Number of Expected Participators:** ${data.expected}\n` +
          `> **Number of Staff Attending:** ${data.staff}\n` +
          `> **Amount of Time Event Will Take:** ${data.duration}\n` +
          `> **Max Participators Limit:** ${data.max}`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("event_confirm")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("event_cancel")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Danger)
      );

      const confirmMessage = await message.channel.send({
        embeds: [confirmEmbed],
        components: [row]
      });

      const buttonCollector = confirmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000
      });

      buttonCollector.on("collect", async i => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: "> You cannot interact with this.", ephemeral: true });
        }

        if (i.customId === "event_cancel") {
          buttonCollector.stop("cancelled");
          await i.update({
            content: "> Log failed. Interaction cancelled.",
            embeds: [],
            components: []
          });
          return;
        }

        if (i.customId === "event_confirm") {
          buttonCollector.stop("confirmed");

          const logs = loadLogs();
          logs.push({
            createdBy: message.author.id,
            createdAt: Date.now(),
            ...data
          });
          saveLogs(logs);

          await i.update({ components: [] });

          const finalEmbed = new EmbedBuilder()
            .setTitle("Event Logged")
            .setColor("Yellow")
            .setDescription(
              `> **Event:** ${data.title}\n` +
              `> **Expected Participators:** ${data.expected}\n` +
              `> **Staff Attending:** ${data.staff}\n` +
              `> **Duration:** ${data.duration}\n` +
              `> **Max Participators:** ${data.max}\n\n` +
              `> **Logged by:** <@${message.author.id}>`
            )
            .setTimestamp();

          const logChannel = message.guild.channels.cache.get(FINAL_LOG_CHANNEL);
          if (logChannel) {
            await logChannel.send({ embeds: [finalEmbed] });
          }
        }
      });

      buttonCollector.on("end", async (_, reason) => {
        if (!["confirmed", "cancelled"].includes(reason)) {
          await confirmMessage.edit({
            content: "> Log failed. Interaction took too long.",
            embeds: [],
            components: []
          }).catch(() => {});
        }
      });
    }
  }
};
