const fs = require("fs");
const path = require("path");

const { sendTicketQuotaEmbed } = require("../others/ticketQuotaLogger");

const LOG_PATH = path.join(__dirname, "../ticketlogs.json");

const ALLOWED_ROLES = [
  "1290085306619396181",
  "1314418348729040946"
];

const VALID_TYPES = ["general", "report", "hr", "other", "community"];

const TICKET_BOT_ID = "1325579039888511056";
const TICKET_BOT_NAME = "Ticket Bot";

const lockedChannels = new Set();

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, JSON.stringify({}, null, 2));
  }
  return JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "handled",

  run: async (client, message, args) => {
    const allowed =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

    if (!allowed) return;
    if (lockedChannels.has(message.channel.id)) return;

    const assistedUser = message.mentions.users.first();
    const ticketType = args[1]?.toLowerCase();
    const reason = args.slice(2).join(" ");

    if (!assistedUser || !ticketType || !reason || !VALID_TYPES.includes(ticketType)) {
      return message.reply(
        "`?handled @user [General/Report/Community/HR/Other] [Reason]`"
      );
    }

    if (ticketType.length > 500 || reason.length > 500) {
      return message.reply("<:ErrorX:1473547704444653568> Each input must be 300 characters or less.");
    }

    // Validate first message in channel
    let fetchedMessages = [];
    let lastId = null;
    for (let i = 0; i < 3; i++) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      const batch = await message.channel.messages.fetch(options);
      if (batch.size === 0) break;
      fetchedMessages.push(...batch.values());
      lastId = batch.last().id;
    }

    const firstMessage = fetchedMessages[fetchedMessages.length - 1];
    if (!firstMessage) {
      return message.reply("<:ErrorX:1473547704444653568> Invalid ticket.");
    }

    let validTicket = false;
    if (firstMessage.author.id === TICKET_BOT_ID) validTicket = true;
    else if (
      firstMessage.embeds?.length &&
      firstMessage.embeds[0].author?.name === TICKET_BOT_NAME
    ) validTicket = true;

    if (!validTicket) {
      return message.reply("<:ErrorX:1473547704444653568> Invalid ticket.");
    }

    lockedChannels.add(message.channel.id);
    const loggingMsg = await message.reply("<:Gear:1467240609830932561> Logging...");

    try {
      const data = loadLog();
      const staffId = message.author.id;

      if (!data[staffId]) {
        data[staffId] = {
          displayName: message.member.displayName,
          count: 0
        };
      }

      data[staffId].count += 1;
      saveLog(data);

      await sendTicketQuotaEmbed(
        client,
        message.guild,
        message.author,
        ticketType,
        reason,
        message.channel.name,
        assistedUser
      );

      await loggingMsg.edit("<:Check:1478581031971061983> **Ticket successfully logged.**");

      setTimeout(async () => {
        try {
          await loggingMsg.delete();
          await message.delete();
        } catch {}
      }, 10_000);

    } finally {
      lockedChannels.delete(message.channel.id); // unlock channel
    }
  }
};