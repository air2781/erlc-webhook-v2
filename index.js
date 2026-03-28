const { 
  Client, GatewayIntentBits, Partials, EmbedBuilder, Collection, Events, AuditLogEvent, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, ActivityType, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { 
  joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus 
} = require('@discordjs/voice');
const { sendFridayLogs } = require("./ticketloghandler");
const { bot } = require("./Config.js");
const Config = require("./Config.js");   
const { token, clientId, guildId, discordEmbedChannelId } = bot;
const { loginRoblox, handleWhitelist, kickUserFromGroup } = require("./others/groupservice.js");
const groupService = require("./others/groupservice.js");
const emergency = require("./others/Emergencylockdown.js");
// --------------------- Discord Client ---------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent // ✅ Important for reading message text
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --------------------- Collections ---------------------
client.commands = new Collection();       // Slash commands
client.slashCommands = new Collection();  // Alias
client.letterCommands = new Collection(); // Prefix commands
// rest
const rest = new REST({ version: "10" }).setToken(bot.token);
// --------------------- Cooldown System ---------------------
const globalCommandCooldowns = new Map();

function checkCooldown(userId, commandName, duration = 2000) {
    const key = `${userId}-${commandName}`;
    
    if (globalCommandCooldowns.has(key)) return true;

    globalCommandCooldowns.set(key, true);
    setTimeout(() => globalCommandCooldowns.delete(key), duration);
    return false;
}



const commandsArray = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);

        if (!command.data || !command.run) {
            console.log(`Skipped (invalid structure): ${file}`);
            continue;
        }

        if (client.commands.has(command.data.name)) {
            console.log(`Skipped duplicate command: ${command.data.name}`);
            continue;
        }

        const json = command.data.toJSON();

        client.commands.set(command.data.name, command);
        commandsArray.push(json);

        console.log(`Loaded command: ${command.data.name}`);
    } catch (err) {
        console.error(`❌ Failed to load command file: ${file}`);
        console.error(err);
        process.exit(1);
    }
}


// --------------------- Slash Interaction Handler ---------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  // ✅ Cooldown Protection
  const cooldownTime = cmd.cooldown || 3000;
  if (checkCooldown(interaction.user.id, interaction.commandName, cooldownTime)) {
      return interaction.reply({
          content: "⏳ You are using this command too quickly.",
          ephemeral: true
      }).catch(() => {});
  }

  try {
    await cmd.run(interaction, client);
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "❌ An error occurred running this command.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

const { execSync } = require("child_process");

function verifyDependencies() {
    try {
        require.resolve("discord.js");
        require.resolve("noblox.js");
    } catch (err) {
        console.log("⚠️ Dependency issue detected. Attempting repair...");

        try {
            execSync("npm install", { stdio: "inherit" });
            console.log("✅ Dependencies reinstalled.");
        } catch (installErr) {
            console.error("❌ Failed to reinstall dependencies:", installErr);
            process.exit(1);
        }
    }
}

verifyDependencies();

// ----------- Load Prefix Commands -----------
const letterCommandsPath = path.join(__dirname, "letterCommands");
if (!fs.existsSync(letterCommandsPath)) fs.mkdirSync(letterCommandsPath);

const letterFiles = fs.readdirSync(letterCommandsPath).filter(f => f.endsWith(".js"));
for (const file of letterFiles) {
    const command = require(path.join(letterCommandsPath, file));

    if (!command.run || !command.name) {
        console.warn(`[WARNING] Prefix command ${file} missing "name" or "run"`);
        continue;
    }

    if (Array.isArray(command.name)) {
        for (const name of command.name) {
            client.letterCommands.set(name.toLowerCase(), command);
            console.log(`Loaded prefix command alias: ${name}`);
        }
    } 
    else {
        client.letterCommands.set(command.name.toLowerCase(), command);
        console.log(`Loaded prefix command: ${command.name}`);
    }
}


// ----------- Prefix Handler -----------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefix = "?";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const cmd = client.letterCommands.get(cmdName);
    if (!cmd) return;

    // ✅ Cooldown Protection
    const cooldownTime = cmd.cooldown || 2500;
    if (checkCooldown(message.author.id, cmdName, cooldownTime)) {
        return message.reply("<:Limited:1473547648068747399> You are using this command too quickly.").catch(() => {});
    }

    try {
        await cmd.run(client, message, args);
    } catch (err) {
        console.error(err);
    }
});

const LOG_CHANNEL_ID = "1290085309190504461";
const ACTIVATION_CHANNEL_ID = "1376285160038731797";

const PING_LIMIT = 3;
const PING_WINDOW_MS = 15 * 60 * 60 * 1000; // 15 HOURS

const pingWindows = new Map();

const { updateQueueEmbed } = require("./others/marketqueuehandler");
require("./others/welcome.js")(client);
// -------------------- Global Crash Protection --------------------

process.on("unhandledRejection", err => {
  console.error("[UNHANDLED PROMISE]", err);
});

process.on("uncaughtException", err => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

client.on("error", (err) => {
    console.error("[CLIENT ERROR]", err);
});

client.on("shardDisconnect", (event, shardId) => {
    console.log(`[SHARD] Disconnected: ${shardId}`);
});

client.on("shardReconnecting", (shardId) => {
    console.log(`[SHARD] Reconnecting: ${shardId}`);
});

const { startTeamNoticeSystem } = require("./API/teampmer");
const modcallNotice = require("./API/modcallspm");
const ytlistener = require("./API/ytlistener");
const { startWeatherTimeSystem } = require("./API/weathertime");
const customHListener = require("./API/hcustommessage");
const { startEventPMSystem } = require("./API/eventpmer");
// -------------------- Bot Ready & Startup ------------------------
const { runStartupScan, flushStartupLogs } = require("./others/batch");

client.once("ready", async () => {
    console.log(`[DISCORD] ✅ Logged in as ${client.user.tag}`);
    client.user.setActivity("gg./nycrpp | NewyorkS", { type: ActivityType.Watching });
    emergency.start(client);

    // --------------------- Refresh Slash Commands ---------------------
    try {
        console.log("Started refreshing application (/) commands...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray }
        );
        console.log("[DISCORD] ✅ Slash commands registered.");
    } catch (err) {
        console.error(err);
    }

    // Roblox systems
    await groupService.loginRoblox();
    startWeatherTimeSystem();
    startTeamNoticeSystem();
    require("./others/tdmHandler.js");
    startEventPMSystem();
    modcallNotice.start(client);
    customHListener(client);
    ytlistener.start(client);

    // Whitelist Embed Setup
    const embedChannels = [
        Config.bot.discordEmbedChannelId,
        "1290085308469346316"
    ];

    const whitelistEmbed = new EmbedBuilder()
        .setTitle("WL Group Access")
        .setDescription(
            "> For users to be accepted into the Whitelisted Group, they must simply follow the instructions below.\n\n" +
            "**Instructions:** \n" +
            "> 1. Request to join the group by linking the group link below and requesting to join.\n" +
            "> 2. Have either the **Whitelisted** or **Game Moderation** role.\n" +
            '> 3. Click the button "Request Access" on this message and the bot will automatically accept you.\n\n' +
            "> [**Group Link**](https://www.roblox.com/communities/15990892/NYC-RP-WL-Staff-Group#!/about)\n" +
            "> -# **Troubleshooting:** If the bot fails to accept, that means you haven't followed one of the steps. If you are sure you did, then it’s likely you haven't verified with *Bloxlink*. If still not, then you can always manually do a role-request."
        )
        .setColor("Yellow");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("request_access")
            .setLabel("Request Access")
            .setStyle(ButtonStyle.Primary)
    );

    for (const channelId of embedChannels) {
        try {
            const channel = await client.channels.fetch(channelId);
            const messages = await channel.messages.fetch({ limit: 50 });

            const exists = messages.some(
                msg => msg.embeds.length && msg.embeds[0].title === "WL Group Access"
            );

            if (!exists) {
                await channel.send({ embeds: [whitelistEmbed], components: [row] });
                console.log(`[DISCORD] 📌 Sent whitelist embed in ${channelId}`);
            } else {
                console.log(`[DISCORD] ✔ Embed already exists in ${channelId}`);
            }

        } catch (err) {
            console.error(`[DISCORD] ❌ Could not process channel ${channelId}`, err);
        }
    }

    // -------------------- Market Queue Embed Sync --------------------
    try {
        const guild = client.guilds.cache.first(); // bot runs in 1 server
        const { updateQueueEmbed } = require("./others/marketqueuehandler");

        await updateQueueEmbed(client, guild);
        console.log("[QUEUE] ✅ Live Queue Status embed synced.");
    } catch (err) {
        console.error("[QUEUE] ❌ Failed syncing queue embed", err);
    }

    // -------------------- STARTUP SCAN + LOG SEND --------------------
    try {
        runStartupScan();
        await flushStartupLogs(client);
    } catch (err) {
        console.error("[STARTUP] ❌ Failed sending startup logs", err);
    }
});

// -------------------- Bloxlink API Function --------------------
async function getRobloxFromDiscord(discordId) {
  try {
    const response = await fetch(
      `https://api.blox.link/v4/public/guilds/${Config.bot.guildId}/discord-to-roblox/${discordId}`,
      {
        headers: {
          "Authorization": Config.bloxlink.apiKey
        }
      }
    );

    if (!response.ok) {
      const channel = await client.channels.fetch("1479534429985701948").catch(() => null);
      if (channel) channel.send(`[BLOXLINK TEST] Response not OK: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.robloxID;

  } catch (err) {
    const channel = await client.channels.fetch("1479534429985701948").catch(() => null);
    if (channel) channel.send(`[BLOXLINK] API Error: ${err}`);
    return null;
  }
}


// -------------------- Interaction Handler --------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "request_access") return;

  // ✅ Safety: defer only if not already deferred/replied
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  try {
    const memberRoles = interaction.member.roles.cache.map(r => r.id);

    // Try Bloxlink first (fallback handled in groupservice)
    const robloxIdFromBloxlink = await getRobloxFromDiscord(interaction.user.id);

    // 🔎 METHOD 1 TEST LOG
    const channel = await client.channels.fetch("1479534429985701948").catch(() => null);
    if (channel) channel.send(`[BLOXLINK TEST] Returned ID: ${robloxIdFromBloxlink}`);

    const result = await groupService.acceptUserToGroup(
      interaction.user.id,
      interaction.member.displayName, // Method 1 (display name)
      memberRoles,
      robloxIdFromBloxlink            // Method 2 (Bloxlink fallback)
    );

    // ✅ Safety: edit only if not already replied
    if (!interaction.replied) {
      return interaction.editReply(result);
    } else {
      // fallback for double interactions
      await interaction.followUp({ content: result, ephemeral: true });
    }

  } catch (err) {
    const channel = await client.channels.fetch("1479534429985701948").catch(() => null);
    if (channel) channel.send(`[REQUEST_ACCESS] Error: ${err}`);
    if (!interaction.replied) {
      return interaction.editReply("An unexpected error occurred. Please try again.");
    } else {
      await interaction.followUp({ content: "An unexpected error occurred. Please try again.", ephemeral: true });
    }
  }
});

const eventAlertListener = require("./others/eventalertlistener");
eventAlertListener.start(client);

const autoRPLog = require("./others/autorplog");
// somewhere in index.js after client is ready
require("./ticketloghandler")(client);

client.on("messageCreate", message => {
  autoRPLog(client, message);
});

// --------------------- Staff Inquiry ---------------------
client.on("messageCreate", (message) => {
  require("./others/autoStaffInquiry")(client, message);
  require("./others/autoBanAppeals")(client, message);
});

// MARKETPLACE //////////////////////////////////////////////////////////////////////////////////////////////////////////////
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const allowedExecutor = "942789806818213949"; // Only this user can execute
  const trigger = "execute403";

  // Only allowed user
  if (message.author.id !== allowedExecutor) return;

  // Check if message starts with Execute403 (case-insensitive)
  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(trigger)) return;

  // Extract input after command
  const input = content.slice(trigger.length).trim();
  if (!input) return message.reply("Provide input.");

  try {
    await groupService.loginRoblox();

    let robloxUsernameOrId;
    let targetMember;

    // Handle Discord mention
    const mentionMatch = input.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      const discordId = mentionMatch[1];
      targetMember = await message.guild.members.fetch(discordId).catch(() => null);
      if (!targetMember) return message.reply("Input invalid.");
      robloxUsernameOrId = targetMember.nickname || targetMember.user.username;

      // Check for Whitelisted Member role
      const hasWhitelistedRole = targetMember.roles.cache.some(r => r.name === "Whitelisted Member");
      if (!hasWhitelistedRole) return message.reply("Input invalid.");
    } else {
      robloxUsernameOrId = input; // Use input as Roblox username or ID
    }

    // Kick user from Roblox group
    let result = await groupService.kickUserFromGroup(robloxUsernameOrId);

    return message.reply(result); // Order executed / error message
  } catch (err) {
    console.error(err);
    return message.reply("Error executing command.");
  }
});

const REPORT_CHANNEL_ID = "1424290893258817536";

client.on("messageReactionAdd", async (reaction, user) => {
    try {
        if (user.bot) return;

        if (!reaction.message.guild) return;
        if (reaction.message.channel.id !== REPORT_CHANNEL_ID) return;

        await reaction.fetch();
        await reaction.message.fetch();

        const msg = reaction.message;

        if (!msg.content.includes("-# CaseID:")) return;

        if (!["✅", "❌"].includes(reaction.emoji.name)) return;

        const handler = user;

        const caseIdMatch = msg.content.match(/-# CaseID:\s*(\S+)/);
        if (!caseIdMatch) return;

        const caseID = caseIdMatch[1];

        const reporterMatch = msg.content.match(/Reporter:\s*<@!?(\d+)>/);
        if (!reporterMatch) return;

        const reporterId = reporterMatch[1];
        const reporter = await client.users.fetch(reporterId).catch(() => null);

        const result = reaction.emoji.name === "✅" ? "valid" : "not valid";

        const timestamp = new Date().toLocaleString("en-CA", {
            timeZone: "America/Toronto",
            hour12: false
        });

        const updatedContent = msg.content.replace(
            /-# .* \| Awaiting moderator review/,
            `-# ${timestamp} | ${handler} (${handler.id}) handled the report and found it to be ${result}`
        );

        await msg.edit(updatedContent);

        await msg.reactions.removeAll();

        if (reporter) {
            try {
                await reporter.send(
`# Game Moderation Report

> Hey ${reporter},
>
> We have successfully reviewed your report as well as the evidence you have provided.
> The moderator who had handled it was ${handler} (${handler.id}). They have concluded that the report was found **${result}**. We thank you for assisting and helping us in stopping rule breakers!
>
> -# CaseID: ${caseID}
> -# If you have any questions or concerns, please open a General ticket and we will be delighted to help you out. Do not reply or message this bot. This is an automated reply and is system-based only.`
                );
            } catch {}
        }

    } catch (err) {
        console.error("GameReport reaction handler error:", err);
    }
});

const warranthandler = require("./warranthandler");
warranthandler.start();



// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const readline = require("readline");
require("./others/staffSuggestUsageWatcher")(client);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "BOT> "
});

rl.prompt();

rl.on("line", async (line) => {
    const input = line.trim().toLowerCase();

    switch (input) {
        case "clear":
        case "clear terminal":
        case "delete":
        case "clean":
            console.clear();
            console.log("Console cleared.");
            break;

        case "bot info":
            console.log("----- BOT INFO -----");
            console.log(`Username: ${client.user.tag}`);
            console.log(`ID: ${client.user.id}`);
            console.log(`Guilds: ${client.guilds.cache.size}`);
            console.log(`Uptime: ${Math.floor(client.uptime / 1000 / 60)} minutes`);
            console.log(`Slash commands loaded: ${client.commands.size}`);
            console.log(`Prefix commands loaded: ${client.letterCommands.size}`);
            console.log("-------------------");
            break;

        case "list guilds":
            console.log("----- GUILDS -----");
            client.guilds.cache.forEach(g => {
                console.log(`Name: ${g.name} | ID: ${g.id} | Members: ${g.memberCount}`);
            });
            console.log("-----------------");
            break;

        case "list users":
            console.log("----- USERS -----");
            let totalUsers = 0;
            client.guilds.cache.forEach(g => {
                totalUsers += g.memberCount;
            });
            console.log(`Total users across all guilds: ${totalUsers}`);
            console.log("-----------------");
            break;

        case "ping":
            console.log(`WebSocket ping: ${client.ws.ping}ms`);
            break;

        case "help":
            console.log("----- CONSOLE COMMANDS -----");
            console.log("clear / clear terminal / delete / clean -> Clear console");
            console.log("bot info -> Display bot information");
            console.log("list guilds -> Show all connected servers");
            console.log("list users -> Show total users across servers");
            console.log("ping -> Show current websocket ping");
            console.log("help -> Show this help message");
            console.log("----------------------------");
            break;

        default:
            console.log(`Unknown command: ${input}. Type "help" for available commands.`);
            break;
    }

    rl.prompt();
});


const APPROVER_ROLES = [
  "1460517136241004574",
  "1410821162564452383",
  "1290085306619396181",
  "1404975343097352304",
  "1404979177538715698"
];

const ALLOWED_CHANNEL_ID = "1455388497065279630";
const APPROVED_LOG_CHANNEL = "1290085309190504461";

// ⛔ Prevent double processing per MESSAGE
const handledMessages = new Set();

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (!["log_ignore", "log_investigate"].includes(interaction.customId)) return;
  if (interaction.channelId !== ALLOWED_CHANNEL_ID) return;

  const messageId = interaction.message.id;

  if (handledMessages.has(messageId)) {
    return interaction.deferUpdate().catch(() => {});
  }

  // ✅ ACK ONCE
  await interaction.deferUpdate().catch(() => {});

  const member = interaction.member;

  const allowed =
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some(r => APPROVER_ROLES.includes(r.id));

  if (!allowed) return;

  // 🔒 lock ONLY after permission passes
  handledMessages.add(messageId);

  const originalEmbed = interaction.message.embeds[0];
  if (!originalEmbed) return;

  function getRandomCompliment() {
    const compliments = [
      "You're a great person for keeping the server safe.",
      "Well done. Your attention helps everyone.",
      "Thanks for assisting us in making our security twice as better.",
      "Your actions help keep this server protected.",
      "Excellent work — the server appreciates you.",
      "Thanks. Without you, how would this server run?"
    ];
    return compliments[Math.floor(Math.random() * compliments.length)];
  }

  const approvedChannel =
    interaction.guild.channels.cache.get(APPROVED_LOG_CHANNEL);
  if (!approvedChannel) return;

  // 🟢 IGNORE
  if (interaction.customId === "log_ignore") {
    const compliment = getRandomCompliment();

    await interaction.message.edit({
      embeds: [
        EmbedBuilder.from(originalEmbed)
          .setColor(0x57f287)
          .setDescription(
            `Action: **Ignore**\nThis log will be archived in 10 seconds.\n\n✅ *${compliment}*`
          )
      ],
      components: []
    });

    const embedCopy = EmbedBuilder.from(originalEmbed);
    const logMsg = interaction.message;

    setTimeout(async () => {
      try { await logMsg.delete(); } catch {}

      await approvedChannel.send({ embeds: [embedCopy] });
      await approvedChannel.send({
        content: `**REVIEWED LOG | Ignored by ${interaction.user.username} (${interaction.user.id})**`
      });
    }, 10_000);

    return;
  }

  // 🔴 INVESTIGATION
  if (interaction.customId === "log_investigate") {
    await interaction.message.edit({
      embeds: [
        EmbedBuilder.from(originalEmbed)
          .setColor(0xed4245)
          .setDescription(
            `⚠️ **WARNING**\nThe log is now under investigation.\nNo permissions were removed.\n\n✅ *${getRandomCompliment()}*`
          )
      ],
      components: []
    });

    const embedCopy = EmbedBuilder.from(originalEmbed);

    await approvedChannel.send({ embeds: [embedCopy] });
    await approvedChannel.send({
      content: `**REVIEWED LOG | Investigation Launched by ${interaction.user.username} (${interaction.user.id})**`
    });

    return;
  }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const fs = require("fs");
    const path = require("path");
    const WARRANT_LOG_PATH = path.join(__dirname, "./warrantlogs.json");

    const warrants = JSON.parse(fs.readFileSync(WARRANT_LOG_PATH, "utf-8"));
    const customId = interaction.customId;

    // ---------------- USER CONFIRMATION BUTTONS ----------------

    if (customId.startsWith("warrant_request_")) {
        const code = customId.split("_")[2];
        const warrant = warrants.find(w => w.code === code);
        if (!warrant) return;

        const reviewChannel = await interaction.client.channels.fetch("1475355514513789028");

        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

        const reviewEmbed = new EmbedBuilder()
            .setTitle(`Warrant Review | ${warrant.username}`)
            .setDescription(
                `**Department:** ${warrant.department}\n` +
                `**Danger Level:** ${warrant.dangerLevel}\n` +
                `**Reason:** ${warrant.reason}\n` +
                `**Notes:** ${warrant.notes}\n` +
                `**Requested by:** ${warrant.issuedBy}`
            )
            .setThumbnail(`https://www.roblox.com/users/id/profile`)
            .setFooter({ text: `Code: ${code}` })
            .setColor("Yellow")
            .setTimestamp();

        const reviewRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`warrant_approve_${code}`)
                .setLabel("Approve")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`warrant_deny_${code}`)
                .setLabel("Deny")
                .setStyle(ButtonStyle.Danger)
        );

        await reviewChannel.send({ embeds: [reviewEmbed], components: [reviewRow] });

        await interaction.update({
            content: "✅ Warrant sent for review.",
            embeds: [],
            components: []
        });
    }

    if (customId.startsWith("warrant_cancel_")) {
        await interaction.update({
            content: "❌ Warrant request cancelled.",
            embeds: [],
            components: []
        });
    }

    // ---------------- ADMIN APPROVE / DENY ----------------

    if (customId.startsWith("warrant_approve_")) {
        const code = customId.split("_")[2];
        const warrant = warrants.find(w => w.code === code);
        if (!warrant) return;

        warrant.status = "Approved";
        fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify(warrants, null, 2));

        await interaction.update({
            content: `✅ Warrant made by ${warrant.issuedBy} was approved by ${interaction.user}.`,
            embeds: [],
            components: []
        });
    }

    if (customId.startsWith("warrant_deny_")) {
        const code = customId.split("_")[2];
        const index = warrants.findIndex(w => w.code === code);
        if (index === -1) return;

        const warrant = warrants[index];
        warrants.splice(index, 1);
        fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify(warrants, null, 2));

        await interaction.update({
            content: `❌ Warrant made by ${warrant.issuedBy} was denied by ${interaction.user}.`,
            embeds: [],
            components: []
        });
    }
});
require("./others/ticketQuotaLogger");
require("./others/consoleSE");


const languageCounter = require("./others/languageCounter");
require("./others/language")(client);

const ACTION_LOG_CHANNEL = "1290085309190504461";
const STAFF_ROLE_ID = "1460517136241004574";

// ⛔ Prevent double-processing per MESSAGE
const handledLanguageMessages = new Set();

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const { customId, member, message, guild } = interaction;

  const validIds = [
    "language_ignore",
    "language_void",
    "log_ignore",
    "log_investigate"
  ];
  if (!validIds.includes(customId)) return;

  const messageId = message.id;

  // ⛔ Already handled this log
  if (handledLanguageMessages.has(messageId)) {
    return interaction.deferUpdate().catch(() => {});
  }
  handledLanguageMessages.add(messageId);

  // ✅ ACK IMMEDIATELY (ONCE)
  await interaction.deferUpdate().catch(() => {});

  // 🔒 Permission check (UNCHANGED)
  const allowed =
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.has(STAFF_ROLE_ID);

  if (!allowed) return;

  const embed = message.embeds[0];
  if (!embed) return;

  // 🔍 EXTRACT USER ID FROM EMBED
  const idMatch =
    embed.footer?.text?.match(/\b\d{17,20}\b/) ||
    embed.description?.match(/\b\d{17,20}\b/);

  if (!idMatch) return;

  const targetUserId = idMatch[0];
  const targetMember = await guild.members.fetch(targetUserId).catch(() => null);

  let actionText = "";
  let deleteDelay = 0;

  // 🟢 IGNORE
  if (customId === "language_ignore" || customId === "log_ignore") {
    actionText = `Ignored by ${member.user.tag}`;
    deleteDelay = 10_000;
  }

  // 🔴 VOID / INVESTIGATE → REMOVE TIMEOUT
  if (customId === "language_void" || customId === "log_investigate") {
    actionText = `Voided by ${member.user.tag}`;
    deleteDelay = 20_000;

    if (targetMember?.communicationDisabledUntilTimestamp) {
      await targetMember
        .timeout(null, "Timeout voided by staff")
        .catch(() => {});
    }
  }

  // ✏️ Update original log (SAFE — no interaction reuse)
  await message.edit({
    embeds: [
      {
        ...embed.toJSON(),
        footer: { text: actionText }
      }
    ],
    components: []
  }).catch(() => {});

  // 📤 SEND ACTION LOG
  const logChannel = guild.channels.cache.get(ACTION_LOG_CHANNEL);
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setTitle("Language Log Action Taken")
      .setColor(customId.includes("ignore") ? 0x2ecc71 : 0xe74c3c)
      .setDescription(
        `**Action:** ${customId}\n` +
        `**Moderator:** ${member.user.tag}\n` +
        `**Target ID:** ${targetUserId}\n` +
        `**Original Log:** ${message.id}`
      )
      .setTimestamp();

    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
  }

  // 🧨 AUTO DELETE
  setTimeout(() => {
    message.delete().catch(() => {});
  }, deleteDelay);
});

const DATA_FILE = "./suggestiondate.json";
const SUGGEST_LOGS = "1290085309190504461"; // replace with real ID
const PING_ROLES = ["1460517136241004574", "1290085306619396181"];

const cooldowns = new Map();

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("suggest_")) return;

  const [, type, id] = interaction.customId.split("_");
  const userId = interaction.user.id;

  // ⏱️ COOLDOWN (3 SECONDS WITH FEEDBACK)
  const now = Date.now();
  if (cooldowns.has(userId) && now - cooldowns.get(userId) < 3000) {
    return interaction.reply({ content: "⏳ Please wait **3 seconds** before voting again.", ephemeral: true });
  }
  cooldowns.set(userId, now);

  const data = loadData();
  const suggestion = data.suggestions[id];
  if (!suggestion) {
    return interaction.reply({ content: "⚠️ This suggestion no longer exists.", ephemeral: true });
  }

  // ✅ ENSURE ARRAYS EXIST (NO LOGIC CHANGE)
  suggestion.yes ??= [];
  suggestion.no ??= [];

  let action = "";

  // 🔁 TOGGLE LOGIC
  if (type === "yes") {
    if (suggestion.yes.includes(userId)) {
      suggestion.yes = suggestion.yes.filter(u => u !== userId);
      action = "Removed YES vote";
    } else {
      suggestion.yes.push(userId);
      suggestion.no = suggestion.no.filter(u => u !== userId);
      action = "Added YES vote";
    }
  }

  if (type === "no") {
    if (suggestion.no.includes(userId)) {
      suggestion.no = suggestion.no.filter(u => u !== userId);
      action = "Removed NO vote";
    } else {
      suggestion.no.push(userId);
      suggestion.yes = suggestion.yes.filter(u => u !== userId);
      action = "Added NO vote";
    }
  }

  saveData(data);

  // 🔄 UPDATE BUTTON COUNTS (THIS IS THE FIX)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`suggest_yes_${id}`)
      .setEmoji("✅")
      .setLabel(String(suggestion.yes.length))
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`suggest_no_${id}`)
      .setEmoji("❌")
      .setLabel(String(suggestion.no.length))
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.update({ components: [row] });

  // 📢 30 YES VOTES → PING 2 ROLES (ONCE)
  if (suggestion.yes.length >= 30 && !suggestion.notified) {
    suggestion.notified = true;
    saveData(data);

    await interaction.followUp({
      content: `<@&${PING_ROLES[0]}>, <@&${PING_ROLES[1]}> suggestion has reached **30 votes**.`,
    });
  }

  // 🧾 LOG EVERY ACTION
  const logEmbed = new EmbedBuilder()
    .setColor(type === "yes" ? "Green" : "Red")
    .setTitle("Suggestion Vote Update")
    .setDescription(
      `**Suggestion ID:** ${id}
**User:** ${interaction.user}
**Action:** ${action}
**Yes Votes:** ${suggestion.yes.length}
**No Votes:** ${suggestion.no.length}`
    )
    .setTimestamp();

  const logChannel = await interaction.guild.channels.fetch(SUGGEST_LOGS);
  if (logChannel) logChannel.send({ embeds: [logEmbed] });
});







// ----------------------------------------------------------------------------------------------------------------------------------------------------

// Login
client.login(bot.token);
