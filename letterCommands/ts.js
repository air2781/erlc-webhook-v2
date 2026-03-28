const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

const discordTTS = require("discord-tts");
const autoHealVC = require("../others/vcHeal");

const bannedWords = ["nigger","nigga"];

const vcState = new Map();
const userCooldown = new Map();

const USER_CD = 3000;
const LEAVE_DELAY = 10000; // ✅ changed to 10 seconds

module.exports = {
  name: "ts",

  async run(client, message, args) {

    // ✅ restrict to specific user IDs
    if (!["942789806818213949", "255041315602038784", "764930309531107388"].includes(message.author.id))
      return;

    if (!args.length) return message.reply("❌ Provide text.");

    let text = args.join(" ");

    // 🔁 readable mentions
    text = text
      .replace(/<@!?(\d+)>/g, (_, id) =>
        message.guild.members.cache.get(id)?.user.username || "user"
      )
      .replace(/<@&(\d+)>/g, (_, id) =>
        message.guild.roles.cache.get(id)?.name || "role"
      )
      .replace(/<#(\d+)>/g, (_, id) =>
        message.guild.channels.cache.get(id)?.name || "channel"
      );

    if (text.length > 900000000) return message.reply("TTS limited to ur mum characters.");

    if (bannedWords.some(w => new RegExp(`\\b${w}\\b`, "i").test(text)))
      return message.reply("Harmful language detected.");

    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Join a VC to use TTS.");

    const now = Date.now();
    if (now - (userCooldown.get(message.author.id) || 0) < USER_CD)
      return message.reply("⏳ Slow down.");

    userCooldown.set(message.author.id, now);

    const guildId = message.guild.id;

    if (!vcState.has(guildId)) {
      vcState.set(guildId, {
        connection: null,
        player: createAudioPlayer(),
        queue: [],
        leaveTimer: null
      });

      attachPlayer(vcState.get(guildId), guildId);
    }

    const state = vcState.get(guildId);

    if (state.leaveTimer) {
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
    }

    state.queue.push({ text, channel }); // ✅ removed username

    message.reply(`🔊 Queued (${state.queue.length})`);

    await safeConnect(state, channel, guildId, message.guild);

    if (state.player.state.status !== AudioPlayerStatus.Playing) {
      playNext(guildId);
    }
  }
};

// ======================= SAFE VC =======================

async function safeConnect(state, channel, guildId, guild) {
  let connection = getVoiceConnection(guildId);

  if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
    try {
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch {
      try { connection?.destroy(); } catch {}
      return;
    }
  }

  connection.subscribe(state.player);
  state.connection = connection;
}

// ======================= QUEUE =======================

async function playNext(guildId) {
  const state = vcState.get(guildId);
  if (!state) return;

  if (!state.queue.length) {
    state.leaveTimer = setTimeout(() => {
      try {
        state.connection?.destroy();
      } catch {}
      state.connection = null;
    }, LEAVE_DELAY);
    return;
  }

  const { text } = state.queue.shift(); // ✅ removed user

  let stream;
  try {
    stream = discordTTS.getVoiceStream(text); // ✅ only input spoken
  } catch {
    stream = discordTTS.getVoiceStream(text);
  }

  const resource = createAudioResource(stream);
  state.player.play(resource);
}

function attachPlayer(state, guildId) {
  state.player.on(AudioPlayerStatus.Idle, () => playNext(guildId));
  state.player.on("error", () => playNext(guildId));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));