const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getTotalQueue, saveTotalQueue, updateQueueEmbed } = require("../others/marketqueuehandler");

const ALLOWED_ROLES = [
  "1290085306619396181",
  "1410821162564452383"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("genqueue")
        .setDescription("Adjust the market queue total.")
        .addStringOption(option =>
            option.setName("amount")
                  .setDescription("Enter a number, +n, or -n to adjust the queue")
                  .setRequired(true)
        ),
    run: async (interaction, client) => {
        const member = interaction.member;

        // Check if user has admin or allowed role
        const hasPermission =
            member.permissions.has(PermissionFlagsBits.Administrator) ||
            ALLOWED_ROLES.some(r => member.roles.cache.has(r));

        if (!hasPermission) {
            return interaction.reply({
                content: "You don’t have permission to use this command.",
                ephemeral: true
            });
        }

        const input = interaction.options.getString("amount");
        let current = getTotalQueue();
        let newTotal;

        if (input.startsWith("+")) {
            newTotal = current + parseInt(input.slice(1));
        } else if (input.startsWith("-")) {
            newTotal = current - parseInt(input.slice(1));
        } else {
            newTotal = parseInt(input);
        }

        if (isNaN(newTotal)) {
            return interaction.reply({
                content: "That isn’t a valid number.",
                ephemeral: true
            });
        }

        if (newTotal < 0) newTotal = 0;

        saveTotalQueue(newTotal);
        await updateQueueEmbed(client, interaction.guild);

        return interaction.reply(
            `<:Gear:1467240609830932561> Market queue adjusted from **${current}** to **${newTotal}**.`
        );
    }
};
