const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const IA_LOG_CHANNEL_ID = "1411155598107607190";
const LOG_PATH = path.join(__dirname, "../iATicketslog.json");

function loadTicketLog() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, JSON.stringify({}, null, 2));
  }

  const raw = fs.readFileSync(LOG_PATH, "utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

async function sendIATicketQuotaEmbed(
  client,
  guild,
  user,
  ticketType,
  reason,
  channelName,
  assistedUser
) {
  const channel = guild.channels.cache.get(IA_LOG_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("IA Ticket Quota Log")
    .setColor("Purple")
    .addFields(
      {
        name: "Internal Affairs",
        value: user.username,
        inline: false
      },
      {
        name: "User Assisted",
        value: assistedUser ? `<@${assistedUser.id}>` : "N/A",
        inline: false
      },
      {
        name: "Ticket Type",
        value: ticketType,
        inline: false
      },
      {
        name: "Reason",
        value: reason,
        inline: false
      },
      {
        name: "Channel",
        value: channelName,
        inline: false
      }
    )
    .setFooter({
      text: `${user.id} | ${new Date().toLocaleString()}`
    })
    .setTimestamp();

  // 🔔 Ping iA staff member who handled it
  await channel.send({
    content: `<@${user.id}>`,
    embeds: [embed]
  });
}

module.exports = {
  loadTicketLog,
  sendIATicketQuotaEmbed
};
