module.exports = {
  name: "300",

  run: async (client, message, args) => {
    const OWNER_ID = "942789806818213949";
    if (message.author.id !== OWNER_ID) return;

    const guilds = [...client.guilds.cache.values()];

    if (!args[0]) {
      let list = guilds
        .map((g, i) => `**${i + 1}.** ${g.name} (${g.id})`)
        .join("\n");

      if (list.length > 1900) list = list.slice(0, 1900) + "\n...";

      return message.reply(
        `🧨 **Bot Servers**\n\n${list}\n\n` +
        `Use:\n` +
        `\`?300 <number>\` **or** \`?300 <guildID>\`\n` +
        `\`?300 <number> invite\` **or** \`?300 <guildID> invite\``
      );
    }

    let targetGuild = null;

    // 🔢 Number-based selection
    if (!isNaN(args[0])) {
      const index = parseInt(args[0], 10);
      if (index < 1 || index > guilds.length) {
        return message.reply("<:Limited:1473547648068747399> Invalid server number.");
      }
      targetGuild = guilds[index - 1];
    } 
    // 🆔 ID-based selection
    else {
      const guildId = args[0].replace(/[<>\s]/g, "");
      targetGuild = client.guilds.cache.get(guildId);

      if (!targetGuild) {
        return message.reply("<:ErrorX:1473547704444653568> Invalid server ID.");
      }
    }

    // 📩 INVITE MODE
    if (args[1] && args[1].toLowerCase() === "invite") {
      try {
        const channel = targetGuild.channels.cache.find(
          c => c.isTextBased && c.permissionsFor(targetGuild.members.me)?.has("CreateInstantInvite")
        );

        if (!channel) return message.reply("<:ErrorX:1473547704444653568> No channel to create invite.");

        const invite = await channel.createInvite({
          maxAge: 0,
          maxUses: 0
        });

        return message.reply(`🔗 Invite for **${targetGuild.name}**:\n${invite.url}`);
      } catch (err) {
        console.error(err);
        return message.reply("<:ErrorX:1473547704444653568> Failed to create invite.");
      }
    }

    // ❌ Prevent self-leave
    if (targetGuild.id === message.guild.id) {
      return message.reply("<:ErrorX:1473547704444653568> I cannot leave the server this command was run in.");
    }

    try {
      await targetGuild.leave();
      message.reply(`<:Check:1478581031971061983> Successfully left **${targetGuild.name}**.`);
    } catch (err) {
      console.error(err);
      message.reply("<:ErrorX:1473547704444653568> Failed to leave the server.");
    }
  }
};
