const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Make the bot say a message")
        .addStringOption(o =>
            o.setName("message")
            .setDescription("What should the bot say?")
            .setRequired(true)
        ),

    async run(interaction, client) {

        // ✅ Prevent interaction timeout immediately
        await interaction.deferReply({ ephemeral: true });

        // Permission check
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.editReply({
                content: "<:X_:1467240500913246461> Only **Administrators** can use /say."
            });
        }

        const msg = interaction.options.getString("message");

        // ----------------------------------------------------
        //         STRONG ROLE + MENTION PROTECTION
        // ----------------------------------------------------

        // 1. block @everyone or @here
        if (/@everyone/i.test(msg) || /@here/i.test(msg)) {
            return interaction.editReply({
                content: "<:Error:1467240551681360086> You cannot ping `@everyone` or `@here`."
            });
        }

        // 2. block ANY formatted mention (<@123>, <@!123>, <@&role>)
        if (/<@&?\d+>/g.test(msg)) {
            return interaction.editReply({
                content: "⚠️ You cannot ping **roles** or **users** in /say."
            });
        }

        // 3. block raw role name mentions like "@Staff"
        const roles = interaction.guild.roles.cache;
        for (const role of roles.values()) {
            const escaped = role.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`@${escaped}`, "i");

            if (regex.test(msg)) {
                return interaction.editReply({
                    content: `<:ErrorX:1473547704444653568> You cannot ping the role **@${role.name}** in /say.`
                });
            }
        }

        // 4. Limit user mentions
        const mentionMatches = msg.match(/<@!?\d+>/g);
        if (mentionMatches && mentionMatches.length > 3) {
            return interaction.editReply({
                content: "<:ErrorX:1473547704444653568> You cannot send more than **3 user mentions**."
            });
        }

        // ----------------------------------------------------
        //                SAFE TO SEND MESSAGE
        // ----------------------------------------------------

        await interaction.editReply({ content: "<:Check:1478581031971061983> Message sent." });

        await interaction.channel.send({
            content: msg,
            allowedMentions: { parse: [] }
        });

        // Logging
        const logChannel = client.channels.cache.get("1479534429985701948");
        if (logChannel) {
            logChannel.send(
                `📝 **/say used by:** ${interaction.user.tag} (${interaction.user.id})\n` +
                `📍 **Channel:** <#${interaction.channel.id}>\n` +
                `💬 **Message:** ${msg}`
            );
        }
    }
};
