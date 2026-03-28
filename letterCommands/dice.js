module.exports = {
    name: "dice",
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Please provide the dice type: 4, 6, or 8.");
        const sides = parseInt(args[0]);
        if (![4,6,8].includes(sides)) return message.reply("Invalid dice. Choose 4, 6, or 8.");
        const result = Math.floor(Math.random() * sides) + 1;
        message.reply(`🎲 You rolled a ${sides}-sided dice: **${result}**`);
    }
};
