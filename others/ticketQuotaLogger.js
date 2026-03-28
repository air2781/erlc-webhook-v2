const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1392982179012804708";
const LOG_PATH = path.join(__dirname, "../Ticketslog.json");

function loadTicketLog() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, JSON.stringify({}, null, 2));
  }

  const raw = fs.readFileSync(LOG_PATH, "utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

async function sendTicketQuotaEmbed(
  client,
  guild,
  user,
  ticketType,
  reason,
  channelName,
  assistedUser // ✅ NEW (last param, backward-safe)
) {
  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("Ticket Quota Log")
    .setColor("Yellow")
    .addFields(
      {
        name: "User",
        value: user.username,
        inline: false
      },
      {
        name: "User Assisted",
        value: assistedUser ? `<@${assistedUser.id}>` : "N/A",
        inline: false
      },
      {
        name: "Type of Ticket",
        value: ticketType,
        inline: false
      },
      {
        name: "Reason For Closure/Handled",
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

  // ✅ PING STAFF (outside embed)
  await channel.send({
    content: `<@${user.id}>`,
    embeds: [embed]
  });
}

module.exports = {
  loadTicketLog,
  sendTicketQuotaEmbed
};
