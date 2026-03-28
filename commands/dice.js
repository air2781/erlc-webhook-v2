const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dice")
        .setDescription("Roll a dice.")
        .addStringOption(option =>
            option.setName("sides")
                .setDescription("Choose the dice type")
                .setRequired(true)
                .addChoices(
                    { name: "4-sided", value: "4" },
                    { name: "6-sided", value: "6" },
                    { name: "8-sided", value: "8" }
                )),
    run: async (interaction) => {
        try {
            const sides = Number(interaction.options.getString("sides"));
            const result = Math.floor(Math.random() * sides) + 1;
            await interaction.reply(`🎲 You rolled a ${sides}-sided dice: **${result}**`);
        } catch (err) {
            console.error("Dice command error:", err);
        }
    }
};
