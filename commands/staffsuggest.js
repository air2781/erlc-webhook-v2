const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../suggestiondate.json");

const SUGGESTION_CHANNEL = "1461976280726634557";
const REQUIRED_ROLE = "1290085306489639026";

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ count: 0, suggestions: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staffsuggest")
    .setDescription("Submit a staff suggestion.")
    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("The name of your idea.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("Type of suggestion")
        .setRequired(true)
        .addChoices(
          { name: "In-Game Related", value: "In-Game Related" },
          { name: "Discord Related", value: "Discord Related" },
          { name: "Both Related", value: "Both Related" }
        )
    )
    .addStringOption(option =>
      option
        .setName("content")
        .setDescription("Explain your suggestion further.")
        .setRequired(true)
    ),

  run: async (interaction) => {
    try {
      // 🔒 Permission check
      const allowed =
        interaction.member.permissions.has("Administrator") ||
        interaction.member.roles.cache.has(REQUIRED_ROLE);

      if (!allowed) {
        return interaction.reply({ content: "<:ErrorX:1473547704444653568> You are not authorized to use this command.", ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const title = interaction.options.getString("title");
      const type = interaction.options.getString("type");
      const content = interaction.options.getString("content");

      const data = loadData();
      data.count += 1;

      const id = String(data.count);

      data.suggestions[id] = {
        id,
        title,
        type,
        content,
        creator: interaction.user.id,
        yes: [],
        no: [],
        notified: false,
        createdAt: Date.now()
      };

      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(`#${id} Suggestion`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setColor("Yellow")
        .setDescription(
          `> **Suggestion Title:** ${title}
> **Suggestion Creator:** ${interaction.user}
> **Suggestion Type:** ${type}

> **Suggestion Information:** ${content}`
        )
        .setFooter({
          text: `New York City Roleplay | ${new Date().toLocaleString()}`
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`suggest_yes_${id}`)
          .setEmoji("✅")
          .setLabel("0")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`suggest_no_${id}`)
          .setEmoji("❌")
          .setLabel("0")
          .setStyle(ButtonStyle.Danger)
      );

      const channel = interaction.guild.channels.cache.get(SUGGESTION_CHANNEL);
      if (!channel) {
        return interaction.editReply("<:ErrorX:1473547704444653568> Suggestion channel not found.");
      }

      const msg = await channel.send({ embeds: [embed], components: [row] });

      // 🧵 Create discussion thread
      await msg.startThread({
        name: "Discussion",
        autoArchiveDuration: 1440
      });

      await interaction.editReply(
        "<:Check:1478581031971061983> **Successfully added!** Please note that for your suggestion to be fully reviewed, you require at least **30 agreeing votes**. Disagreeing votes will be accounted for as well."
      );
    } catch (err) {
      console.error("staffsuggest error:", err);
    }
  }
};
