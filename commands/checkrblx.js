const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const noblox = require("noblox.js");

const cache = new Map();

function parseRobloxUsername(input) {
  if (!input || typeof input !== "string") return null;
  input = input.trim();
  const match = input.match(/\b[a-zA-Z0-9_]{3,20}\b/);
  return match ? match[0] : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkrblx")
    .setDescription("Check Roblox user info by username")
    .addStringOption(option =>
      option
        .setName("input")
        .setDescription("Roblox username")
        .setRequired(true)
    ),

  run: async (interaction) => {
    const input = interaction.options.getString("input");
    const username = parseRobloxUsername(input);

    if (!username) {
      return interaction.reply({
        content: "Invalid Roblox username provided.",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Cache check
    const key = username.toLowerCase();
    if (cache.has(key)) {
      return interaction.editReply({ embeds: [cache.get(username)] });
    }

    try {
      const userId = await noblox.getIdFromUsername(username);

      // Lightweight endpoint only
      const userInfo = await noblox.getUserInfo(userId);

      const thumbnail = await noblox.getPlayerThumbnail(
        userId,
        420,
        "png",
        false
      );

      const created = userInfo.created
        ? new Date(userInfo.created).toLocaleString()
        : "N/A";

      const embed = new EmbedBuilder()
        .setTitle("Roblox Information Lookup")
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setColor(0xFFFF00)
        .setThumbnail(thumbnail?.[0]?.imageUrl || null)
        .setDescription(
`**Username:** ${username}

**User ID:** ${userId}

**Display Name:** ${userInfo.displayName || "N/A"}

**Account Created:** ${created}

**Description:** ${userInfo.blurb || "None"}

**Banned:** ${userInfo.isBanned ? "Yes" : "No"}`
        )
        .setFooter({
          text: `New York Utils | Command ran by ${interaction.user.username}`
        })
        .setTimestamp();

      // Cache for 2 minutes
      cache.set(username, embed);
      setTimeout(() => cache.delete(username), 120000);

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: `Could not fetch Roblox user: ${username}`,
        ephemeral: true
      });
    }
  }
};