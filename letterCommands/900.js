module.exports = {
  name: "900",

  run: async (client, message, args) => {
    if (!args[0]) {
      return message.reply("Operator did not receive.");
    }

    if (args.join(" ").toLowerCase() === "true") {
      return message.reply("Operator received.");
    }

    return message.reply("Operator did not receive.");
  }
};
