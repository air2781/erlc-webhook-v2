const fs = require("fs");
const path = require("path");

const { sendIATicketQuotaEmbed } = require("../others/IATicketQuotaLogger");

const LOG_PATH = path.join(__dirname, "../IATicketslog.json");

// ✅ iA ONLY
const IA_ALLOWED_ROLES = [
  "1406836170595369000" // iA role
];

const VALID_TYPES = ["General", "Report", "Appeal", "Other", "other", "general", "report", "hr", "HR", "hr+", "appeal", "HR+"];

const TICKET_BOT_ID = "1325579039888511056";
const TICKET_BOT_NAME = "Ticket Bot";

// ⛔ Lock per channel
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
  name: "IAhandled",

  run: async (client, message, args) => {
    // 🔒 Permission check (ADMIN OR iA)
    const allowed =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.some(r => IA_ALLOWED_ROLES.includes(r.id));

    if (!allowed) return;

    // ⛔ Already handled
    if (lockedChannels.has(message.channel.id)) return;

    // 📌 Fetch oldest message (API-safe)
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

    // ✅ STEP 1: Sent by ticket bot
    let validTicket = false;

    if (firstMessage.author.id === TICKET_BOT_ID) {
      validTicket = true;
    }

    // 🔁 STEP 2: Embed authored by ticket bot
    else if (
      firstMessage.embeds &&
      firstMessage.embeds.length > 0 &&
      firstMessage.embeds[0].author &&
      firstMessage.embeds[0].author.name === TICKET_BOT_NAME
    ) {
      validTicket = true;
    }

    if (!validTicket) {
      return message.reply("<:ErrorX:1473547704444653568> Invalid ticket.");
    }

    // FORMAT: ?handled @user Type Reason
    const assistedUser = message.mentions.users.first();
    const ticketType = args[1];
    const reason = args.slice(2).join(" ");

    if (
      !assistedUser ||
      !ticketType ||
      !reason ||
      !VALID_TYPES.includes(ticketType)
    ) {
      return message.reply(
        "You must use:\n" +
        "`?iahandled [Mention User] [General/Report/HR+] [Reason]`"
      );
    }

    if (ticketType.length > 300 || reason.length > 300) {
      return message.reply("<:ErrorX:1473547704444653568> Each input must be 300 characters or less.");
    }

    // 🔒 Lock channel
    lockedChannels.add(message.channel.id);

    const loggingMsg = await message.reply("<:Gear:1467240609830932561> Logging IA ticket...");

    // 📊 Update iA quota log
    const data = loadLog();
    const staffId = message.author.id;

    if (typeof data[staffId] !== "number") {
      data[staffId] = 0;
    }

    data[staffId] += 1;
    saveLog(data);

    // 📤 Send quota embed
    await sendIATicketQuotaEmbed(
      client,
      message.guild,
      message.author,
      ticketType,
      reason,
      message.channel.name,
      assistedUser
    );

    await loggingMsg.edit("<:Check:1478581031971061983> **IA ticket successfully logged.**");

    // 🧹 Cleanup
    setTimeout(async () => {
      try {
        await loggingMsg.delete();
        await message.delete();
      } catch {}
    }, 10_000);
  }
};
