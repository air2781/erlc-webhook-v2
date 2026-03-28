const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const GUILD_ID = "1290085306489639023";
const STAFF_ROLE_ID = "1290085306489639026";
const STAFF_CHANNEL_ID = "1290085308469346315";

const DISABLE_PATH = path.join(__dirname, "DisableAutoASI.json");

// 🔒 Permanent single identifier code (NO generation)
const STAFF_INQUIRY_TAG = "2D8XY8BOL2M";

// Broad keyword detection
const STAFF_KEYWORDS = [
  "how do i become staff",
  "how to become staff",
  "how to be staff",
  "how can i become staff",
  "staff application",
  "apply for staff",
  "become staff",
  "join staff",
  "staff form",
  "staff position",
  "get staff",
  "be a staff member",
  "how do i join staff",
  "how can i join staff",
  "staff recruitment",
  "how to apply staff",
  "becoming staff",
  "staff application link",
  "staff apply",
  "how to be a staff member",
  "how to get staff",
  "staff joining",
  "join the staff",
  "apply staff",
  "become a staff member",
  "staff registration",
  "how do i apply staff",
  "how to become a nyc staff",
  "how do i join nyc staff",
  "nyc staff application",
  "staff signup",
  "staff form link",
  "staff application form",
  "staff recruitment form",
  "be staff",
  "staff joining form",
  "join nyc staff",
  "how to join nyc staff team",
  "become staff nyc",
  "nyc staff",
  "staff application nyc",
  "how to apply for staff",
  "how do i get staff role",
  "staff application guide",
  "staff application help",
  "staff apply link",
  "nyc staff role",
  "nyc staff member",
  "staff joining link",
  "staff application process",
  "staff form nyc"
];

// Cooldown per user
const cooldown = new Map();
const COOLDOWN_MS = 60_000;

function loadDisabled() {
  if (!fs.existsSync(DISABLE_PATH)) {
    fs.writeFileSync(
      DISABLE_PATH,
      JSON.stringify({ disabled: [] }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(DISABLE_PATH, "utf8"));
}

function saveDisabled(data) {
  fs.writeFileSync(DISABLE_PATH, JSON.stringify(data, null, 2));
}

module.exports = async (client, message) => {
  try {
    if (!message.guild) return;
    if (message.guild.id !== GUILD_ID) return;
    if (message.author.bot) return;

    const member = message.member;
    if (!member) return;

    const disabledData = loadDisabled();

    if (disabledData.disabled.includes(message.author.id)) return;

    // Handle opt-out reply
    if (message.reference?.messageId) {
      const repliedTo = await message.channel.messages
        .fetch(message.reference.messageId)
        .catch(() => null);

      if (
        repliedTo &&
        repliedTo.author.id === client.user.id &&
        repliedTo.content.includes(STAFF_INQUIRY_TAG) &&
        message.content.toLowerCase().trim() === "yes"
      ) {
        if (!disabledData.disabled.includes(message.author.id)) {
          disabledData.disabled.push(message.author.id);
          saveDisabled(disabledData);
        }

        return message.reply(
          "✅ You will no longer receive automated staff inquiry messages."
        );
      }
    }

    if (
      member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      member.roles.cache.has(STAFF_ROLE_ID)
    ) return;

    const content = message.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

    const matched = STAFF_KEYWORDS.some(keyword =>
      content.includes(keyword)
    );
    if (!matched) return;

    const last = cooldown.get(message.author.id);
    if (last && Date.now() - last < COOLDOWN_MS) return;
    cooldown.set(message.author.id, Date.now());

    const staffChannel = message.guild.channels.cache.get(STAFF_CHANNEL_ID);

    await message.reply({
      content:
        "To apply and become an Official Staff Member of **New York City Roleplay**, " +
        "apply by clicking [**here**](https://melonly.xyz/forms/7324268282796576768) " +
        "or by visiting the channel " +
        `${staffChannel ? staffChannel : "#staff-applications"}.\n` +
        "-# Don’t want to receive these automated messages? Reply **\"yes\"** to this message.\n" +
        `-# ${STAFF_INQUIRY_TAG}`
    });

  } catch (err) {
    console.error("AutoStaffInquiry error:", err);
  }
};
