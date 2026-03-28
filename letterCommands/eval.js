const util = require("util");

module.exports = {
  name: "eval",

  run: async (client, message, args) => {
    // OWNER LOCK
    if (message.author.id !== "942789806818213949") return;

    if (!args.length)
      return message.reply("<:Check:1478581031971061983> Provide code to evaluate.");

    const code = args.join(" ");
    const start = Date.now();

    try {
      let evaled = await eval(`(async () => { ${code} })()`);

      if (typeof evaled !== "string") {
        evaled = util.inspect(evaled, { depth: 1 });
      }

      // Hide bot token
      evaled = evaled.replace(
        new RegExp(client.token, "gi"),
        "[REDACTED]"
      );

      const time = Date.now() - start;

      message.reply(
        `<:Check:1473547604921942046> **Eval Success** \`(${time}ms)\`\n` +
        "```js\n" +
        evaled.slice(0, 1900) +
        "\n```"
      );

    } catch (err) {
      const time = Date.now() - start;

      message.reply(
        `❌ **Eval Error** \`(${time}ms)\`\n` +
        "```js\n" +
        err.toString().slice(0, 1900) +
        "\n```"
      );
    }
  }
};
