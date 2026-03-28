const CHANNEL_ID = "1461976280726634557";

// Embed counter (resets automatically)
let embedCount = 0;

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    // Only target channel
    if (message.channel.id !== CHANNEL_ID) return;

    // MUST be an embed
    if (!message.embeds || message.embeds.length === 0) return;

    // OPTIONAL: only count bot embeds (recommended)
    if (!message.author.bot) return;

    embedCount++;

    // Trigger every 5 embeds
    if (embedCount >= 5) {
      embedCount = 0; // 🔁 RESET COUNT

      await message.channel.send({
        content: `# Staff Suggestions Usage

> To create a suggestion, you must use \`/staffsuggest\`.  
> High Ranks may use \`?closethread\` to close any discussions.  
> Please respect all ideas and avoid unnecessary criticism.  
> Debates are allowed, but if a HR asks you to stop, you must comply.`
      });
    }
  });
};
