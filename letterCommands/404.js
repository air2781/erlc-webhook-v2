module.exports = {
  name: "404",

  run: async (client, message, args) => {
    // 🔒 Hard restriction
    if (message.author.id !== "942789806818213949") return;

    // No input
    if (!args[0]) {
      return message.reply(
        "Operator defined as null has successfully been operated."
      );
    }

    // Mentioned user
    const user =
      message.mentions.users.first() ||
      message.guild.members.cache.get(args[0])?.user;

    if (!user) {
      return message.reply(
        "Issuing service..."
      );
    }

    // Step 1: finding...
    const findingMsg = await message.reply(
      `**${user.username}** finding...`
    );

    // Step 2: wait 1.5 seconds
    setTimeout(async () => {
      try {
        await findingMsg.delete();
        await message.reply(
          "User's information has been bypassed by system to 4912858421494 (Refer to operator's panel)."
        );
      } catch {}
    }, 1000);
  }
};
