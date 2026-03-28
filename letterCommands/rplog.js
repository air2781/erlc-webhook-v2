module.exports = {
    name: "rplog",
    run: async (client, message, args) => {

        const ROLE_ID = "1290085306489639026";
        const LOG_CHANNEL_ID = "1320570118920470599";

        const X = "<:ErrorX:1473547704444653568>";
        const TICK = "<:Check:1478581031971061983>";

        const replyAndDelete = async (content) => {
            const msg = await message.reply(content);
            setTimeout(() => msg.delete().catch(() => {}), 6000);
        };

        if (
            !message.member.permissions.has("Administrator") &&
            !message.member.roles.cache.has(ROLE_ID)
        ) {
            return replyAndDelete(`${X} You do not have permission to use this command.`);
        }

        const formatMsg =
`${X} Incorrect format.

Use:
\`?rplog [Username(s)] [Type] [Postal] [Y/N]\`

The type can be multiple words as long as you separately add Y/N to the end of the sentence.  
Y/N indicates if the permission is for all users, or for the first user listed as "main". By the way, if a RP log has no postal, simply use 000.`;

        if (args.length < 4) return replyAndDelete(formatMsg);

        const yn = args[args.length - 1].toLowerCase();
        if (!["y", "yes", "n", "no"].includes(yn)) return replyAndDelete(formatMsg);

        const postal = args[args.length - 2];
        if (!/^\d+$/.test(postal)) return replyAndDelete(formatMsg);

        const users = args[0]
            .split(",")
            .map(u => u.trim())
            .filter(Boolean);

        const type = args.slice(1, -2).join(" ");
        if (!type) return replyAndDelete(formatMsg);

        const isGroup = ["y", "yes"].includes(yn) ? "True" : "False";

        const now = new Date();

        const time = d =>
            d.toLocaleTimeString("en-US", {
                timeZone: "America/Toronto",
                hour12: false,
                hour: "2-digit",
                minute: "2-digit"
            });

        const date = now.toLocaleDateString("en-CA", {
            timeZone: "America/Toronto"
        });

        const end = new Date(now.getTime() + 60 * 60 * 1000);

        const channel = await client.channels.fetch(LOG_CHANNEL_ID);

        const userList = users.join(", ");

        await channel.send(
`# Roleplay Log 🚔
> **Staff Member Logging:** ${message.author}
> ------------------------------------------------------------
> **User(s):** ${userList}
> **Type of Roleplay Permission or Authorization:** ${type}
> **Postal:** ${postal}
> ------------------------------------------------------------
> **Group or Collective Permission (Multiple People): ${isGroup}**
> **Date:** ${date}
> **Expiry Date of Permission:** ${time(now)} right now, expiring later at ${time(end)} **EST**`
        );

        // ✅ delete command message if successful
        message.delete().catch(() => {});

        replyAndDelete(`${TICK} Roleplay log submitted successfully.`);
    }
};
