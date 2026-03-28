const {
  getVoiceConnection,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const COOLDOWN = 5 * 60 * 1000;
const restartCooldown = new Map();

module.exports = {
  name: "restartvc",
  async run(client, message) {
    const guild = message.guild;
    const guildId = guild.id;
    const botMember = guild.members.me;

    if (restartCooldown.has(guildId)) {
      const until = restartCooldown.get(guildId);
      if (Date.now() < until) {
        const left = Math.ceil((until - Date.now()) / 1000);
        return message.reply(`⏳ Restart cooldown — wait ${left}s`);
      }
    }

    const connection = getVoiceConnection(guildId);

    const broken =
      !botMember.voice.channel ||
      !connection ||
      connection.state.status === VoiceConnectionStatus.Destroyed ||
      connection.state.status === VoiceConnectionStatus.Disconnected;

    if (!broken) return message.reply("<:Check:1478581031971061983> VC healthy — no restart needed.");

    try {
      if (connection) connection.destroy();
      if (botMember.voice.channel) await botMember.voice.setChannel(null);

      restartCooldown.set(guildId, Date.now() + COOLDOWN);

      message.reply("<:Warning:1473548393006633196> Voice system restarted.");
    } catch (err) {
      console.error(err);
      message.reply("❌ Restart failed.");
    }
  }
};
