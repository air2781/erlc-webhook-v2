const {
  getVoiceConnection,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const VC_COOLDOWN = 5 * 60 * 1000;
const healCooldown = new Map();

async function autoHealVC(guild) {
  const guildId = guild.id;
  const botMember = guild.members.me;
  const connection = getVoiceConnection(guildId);

  if (healCooldown.has(guildId)) {
    if (Date.now() < healCooldown.get(guildId)) return;
  }

  const broken =
    !botMember.voice.channel ||
    !connection ||
    connection.state.status === VoiceConnectionStatus.Destroyed ||
    connection.state.status === VoiceConnectionStatus.Disconnected;

  if (!broken) return;

  try {
    if (connection) connection.destroy();
    if (botMember.voice.channel) await botMember.voice.setChannel(null);

    healCooldown.set(guildId, Date.now() + VC_COOLDOWN);

    console.log(`[VC AUTO-HEAL] Restarted in ${guild.name}`);
  } catch (e) {
    console.error("VC heal error:", e);
  }
}

module.exports = autoHealVC;
