const { getTotalQueue, saveTotalQueue, updateQueueEmbed } = require("../others/marketqueuehandler");

const ALLOWED_ROLES = [
  "1290085306619396181",
  "1410821162564452383"
];

module.exports = {
  name: "genqueue",

  run: async (client, message, args) => {
    const member = message.member;

    // Check permissions
    const hasPermission =
      member.permissions.has("ADMINISTRATOR") ||
      ALLOWED_ROLES.some(r => member.roles.cache.has(r));

    if (!hasPermission) {
      return message.reply("You don’t have permission to use this command.");
    }

    if (!args[0]) {
      return message.reply("Use: `?genqueue +1`, `?genqueue -1`, or `?genqueue 25`");
    }

    let current = getTotalQueue();
    let input = args[0];
    let newTotal;

    // Adjust total
    if (input.startsWith("+")) {
      newTotal = current + parseInt(input.slice(1));
    } else if (input.startsWith("-")) {
      newTotal = current - parseInt(input.slice(1));
    } else {
      newTotal = parseInt(input);
    }

    if (isNaN(newTotal)) {
      return message.reply("That isn’t a valid number.");
    }

    if (newTotal < 0) newTotal = 0;

    // Save new total
    saveTotalQueue(newTotal);

    // Update the embed
    await updateQueueEmbed(client, message.guild);

    // Reply in a ping-style embed/message
    return message.reply(
      `<:Check:1478581031971061983> Market queue adjusted from **${current}** to **${newTotal}**.`
    );
  }
};
