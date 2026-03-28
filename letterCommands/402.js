const fs = require("fs");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

const OWNER_ID = "942789806818213949";
const LOG_CHANNEL_ID = "1290085309190504461";

let activeSession = false;

module.exports = {
  name: "402",
  async run(client, message, args) {
    if (message.author.id !== OWNER_ID) return;

    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    const log = (msg) => logChannel?.send(msg).catch(() => {});

    const direct = args[0] === "true";

    log(`🟢 402 INIT — Direct: ${direct}`);

    if (activeSession && !direct)
      return message.reply("⚠️ 402 already running.");

    const statusMsg = await message.channel.send("🔌 Connecting to core system...");

    await wait(1200);

    if (!direct) {
      if (!connectSystem()) {
        log("❌ CONNECTION FAILED");

        return forcePrompt(statusMsg, log, message);
      }
    }

    activeSession = true;
    log("✅ CONNECTION ESTABLISHED");

    await statusMsg.edit("<:Check:1478581031971061983> System connected.");

    openControlPanel(message, log);
  }
};

function connectSystem() {
  return fs.existsSync("./"); // real system check
}

// =====================
// FORCE PROMPT
// =====================
async function forcePrompt(msg, log, message) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("force_yes")
      .setLabel("Force Connect")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("force_no")
      .setLabel("Abort")
      .setStyle(ButtonStyle.Secondary)
  );

  await msg.edit({
    content: "❌ Core not responding. Force connection?",
    components: [row]
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 20000,
    filter: i => i.user.id === OWNER_ID
  });

  collector.on("collect", async i => {
    await i.deferUpdate();

    if (i.customId === "force_no") {
      log("🛑 FORCE ABORTED");
      return msg.edit({ content: "🛑 Aborted.", components: [] });
    }

    activeSession = true;
    log("🔥 FORCE SUCCESS");

    msg.edit({ content: "🔥 Forced connection successful.", components: [] });

    openControlPanel(message, log);
  });
}

// =====================
// CONTROL PANEL
// =====================
async function openControlPanel(message, log) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("files")
      .setLabel("Files")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("sum")
      .setLabel("Sum")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("exit")
      .setLabel("Exit")
      .setStyle(ButtonStyle.Secondary)
  );

  const panel = await message.channel.send({
    content: "🧠 **402 Developer Control Panel**",
    components: [row]
  });

  const collector = panel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
    filter: i => i.user.id === OWNER_ID
  });

  collector.on("collect", async i => {
    await i.deferReply({ ephemeral: true });

    // 📁 REAL FILE LIST
    if (i.customId === "files") {
      log("📁 FILE SYSTEM OPENED");

      const files = fs.readdirSync("./").slice(0, 15).join("\n");

      return i.editReply(`📁 Files:\n\`\`\`\n${files}\n\`\`\``);
    }

    // ➕ REAL SUM TOOL
    if (i.customId === "sum") {
      log("➕ SUM MODULE");

      return i.editReply(
        "➕ Use: `?402sum 5 10 20`\n(Add a quick command below)"
      );
    }

    // 🔴 EXIT
    if (i.customId === "exit") {
      log("🔴 SYSTEM SHUTDOWN");
      activeSession = false;

      await panel.edit({ components: [] });

      return i.editReply("🔴 402 shut down.");
    }
  });
}

// =====================
// EXTRA REAL COMMAND (?402sum)
// =====================
module.exports.sum = async (message, args) => {
  if (message.author.id !== OWNER_ID) return;

  const nums = args.map(n => Number(n)).filter(n => !isNaN(n));

  if (!nums.length) return message.reply("Give numbers.");

  const total = nums.reduce((a, b) => a + b, 0);

  message.reply(`➕ Total: **${total}**`);
};

// =====================
const wait = ms => new Promise(r => setTimeout(r, ms));
