const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rplog")
        .setDescription("Submit a roleplay log.")
        .addStringOption(option =>
            option.setName("users")
                .setDescription("Username(s) separated by commas")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Type of roleplay permission or authorization")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("postal")
                .setDescription("Postal (use 000 if none)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("group")
                .setDescription("IGNORE | Just a placeholder")
                .setRequired(false)
        ),

    run: async (interaction, client) => {
        try {

            const ROLE_ID = "1290085306489639026";
            const LOG_CHANNEL_ID = "1320570118920470599";

            const X = "<:ErrorX:1473547704444653568>";
            const TICK = "<:Check:1478581031971061983>";

            const reply = async (content) => {
                return interaction.reply({ content, ephemeral: true });
            };

            if (
                !interaction.member.permissions.has("Administrator") &&
                !interaction.member.roles.cache.has(ROLE_ID)
            ) {
                return reply(`${X} You do not have permission to use this command.`);
            }

            const usersInput = interaction.options.getString("users");
            const type = interaction.options.getString("type");
            const postal = interaction.options.getString("postal");
            const yn = interaction.options.getString("group").toLowerCase();

            const formatMsg =
`${X} Incorrect format.

Use:
/rplog users:[Username(s)] type:[Type] postal:[Postal] group:[Y/N]

Y/N indicates if the permission is for all users, or for the first user listed as "main".
If a RP log has no postal, simply use 000.`;

            if (!["y", "yes", "n", "no"].includes(yn)) return reply(formatMsg);
            if (!/^\d+$/.test(postal)) return reply(formatMsg);
            if (!type) return reply(formatMsg);

            const users = usersInput
                .split(",")
                .map(u => u.trim())
                .filter(Boolean);

            if (!users.length) return reply(formatMsg);

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
> **Staff Member Logging:** ${interaction.user}
> ------------------------------------------------------------
> **User(s):** ${userList}
> **Type of Roleplay Permission or Authorization:** ${type}
> **Postal:** ${postal}
> ------------------------------------------------------------
> **Group or Collective Permission (Multiple People): ${isGroup}**
> **Date:** ${date}
> **Expiry Date of Permission:** ${time(now)} right now, expiring later at ${time(end)} **EST**`
            );

            await interaction.reply({
                content: `${TICK} Roleplay log submitted successfully.`,
                ephemeral: true
            });

        } catch (err) {
            console.error("rplog command error:", err);
        }
    }
};
