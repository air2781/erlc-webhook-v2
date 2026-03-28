const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const MAX_SCAN = 400;
const LOG_CHANNEL_ID = "1290085309190504462";

/**
 * 🚨 TOS-Violating Regex Patterns
 */
const BANNED_PATTERNS = [
  // Hate / slurs
  /n[\W_]*i[\W_]*g[\W_]*g[\W_]*e[\W_]*r/i,
  /f[\W_]*a[\W_]*g/i,
  /r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d/i,
  /k[\W_]*i[\W_]*k[\W_]*e/i,
  /c[\W_]*o[\W_]*o[\W_]*n/i,

  // Self-harm encouragement
  /k[\W_]*y[\W_]*s/i,
  /kill[\W_]*yourself/i,
  /go[\W_]*die/i,

  // Harassment / threats
  /die[\W_]*bitch/i,
  /fuck[\W_]*you/i,
  /fuck[\W_]*off/i,
  /cunt/i,
  /rape/i,

  // Extremism
  /nazi/i,
  /hitler/i,
  /heil/i,

  // Sexual / obscene
  /pedo|pedophile/i,
  /cum[\W_]*slut/i
];

// 🔍 Safe checker
function violatesTOS(text) {
  if (!text) return false;
  return BANNED_PATTERNS.some(rx => rx.test(text));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scan")
    .setDescription("Scan members of a role for TOS-violating usernames")
    .addRoleOption(opt =>
      opt
        .setName("role")
        .setDescription("Role to scan")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ✅ FIXED SIGNATURE
  run: async (interaction, client) => {
    const executor = interaction.member;
    const role = interaction.options.getRole("role");

    await interaction.deferReply({ ephemeral: true });

    // Ensure cache is filled
    await interaction.guild.members.fetch();

    const members = role.members.first(MAX_SCAN);
    const violators = [];

    for (const member of members.values()) {
      const checks = [
        member.user.username,
        member.user.globalName,
        member.nickname
      ];

      if (checks.some(text => violatesTOS(text))) {
        violators.push(member);
      }
    }

    // No violations found
    if (!violators.length) {
      return interaction.editReply({
        content: `✅ No TOS-violating usernames found in **${role.name}** (scanned ${members.size}/${MAX_SCAN}).`
      });
    }

    // Limit embed size
    const shown = violators.slice(0, 25);

    const embed = new EmbedBuilder()
      .setTitle("🚨 TOS-Violating Usernames Detected")
      .setDescription(
        shown
          .map(m => `> **${m.user.tag}** (${m.id})`)
          .join("\n")
      )
      .setFooter({
        text:
          violators.length > 25
            ? `Showing 25 of ${violators.length} found • Scanned ${members.size}/${MAX_SCAN}`
            : `Total found: ${violators.length} • Scanned ${members.size}/${MAX_SCAN}`
      })
      .setTimestamp();

    // Send to log channel
    const logChannel = await interaction.guild.channels
      .fetch(LOG_CHANNEL_ID)
      .catch(() => null);

    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    // Ephemeral confirmation
    return interaction.editReply({
      content: `🚨 **${violators.length}** user(s) with potential TOS-violating usernames were detected and logged.`
    });
  }
};
