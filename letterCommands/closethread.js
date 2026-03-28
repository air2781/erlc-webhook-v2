module.exports = {
  name: "closethread",

  run: async (client, message) => {
    const allowedRoles = [
      "1314418348729040946",
      "1460517136241004574",
      "1290085306619396181"
    ];

    const allowed =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.some(r => allowedRoles.includes(r.id));

    if (!allowed) return;

    const channel = message.channel;
    if (!channel.isThread()) return;

    await message.channel.send("**Closing thread...**");

    const logChannel = message.guild.channels.cache.get("1290085309190504461");
    if (logChannel) {
      logChannel.send(
        `<:Check:1478581031971061983> Thread **${channel.name}** closed by **${message.author.tag}** (${message.author.id})`
      );
    }

    // ❌ DELETE THREAD
    await channel.delete();
  }
};
