const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("prefix")
        .setDescription("Shows the prefix for this bot."),
    run: async (interaction) => {
        const prefix = "?"; // The bot's prefix
        await interaction.reply(`The prefix set for this bot is \`${prefix}\`.`);
    }
};
