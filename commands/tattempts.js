const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tattempts")
        .setDescription("Edit a trainee's attempts count.")
        .addUserOption(option =>
            option.setName("user").setDescription("User to update.").setRequired(true))
        .addStringOption(option =>
            option.setName("number").setDescription("The new attempts number.").setRequired(true)),
    
    run: async (interaction, client) => {
        try {
            const editor = interaction.member;
            const target = interaction.options.getUser("user");
            const numberInput = interaction.options.getString("number");

            // PERMISSION CHECK
            const allowedRole = "1373024734010282044";
            if (!editor.permissions.has("Administrator") && !editor.roles.cache.has(allowedRole)) {
                return interaction.reply({
                    content: "<:ErrorX:1473547704444653568> You do not have permission to use this command.",
                    ephemeral: true
                });
            }

            // NUMBER VALIDATION
            if (!/^[0-9]+$/.test(numberInput)) {
                return interaction.reply({
                    content: "<:ErrorX:1473547704444653568> The attempts must be a **number only**.",
                    ephemeral: true
                });
            }

            const newAttempts = parseInt(numberInput);

            const channel = interaction.guild.channels.cache.get("1313633542055399545");
            if (!channel) {
                return interaction.reply({
                    content: "<:ErrorX:1473547704444653568> Log channel not found.",
                    ephemeral: true
                });
            }

            // FETCH MESSAGES
            const messages = await channel.messages.fetch({ limit: 50 });

            let foundMessage = null;
            let foundEmbed = null;
            let oldAttempts = null;

            messages.forEach(msg => {
                if (!msg.embeds.length) return;

                const embed = msg.embeds[0];
                const userField = embed.fields.find(f => f.name === "User");
                if (!userField) return;

                if (userField.value === `<@${target.id}>`) {
                    const attemptsField = embed.fields.find(f => f.name === "Attempts");
                    if (attemptsField) {
                        foundMessage = msg;
                        foundEmbed = embed;
                        oldAttempts = attemptsField.value;
                    }
                }
            });

            if (!foundMessage || !foundEmbed) {
                return interaction.reply({
                    content: "<:ErrorX:1473547704444653568> No training log with attempts found for that user.",
                    ephemeral: true
                });
            }

            // BUILD UPDATED EMBED
            const updatedEmbed = EmbedBuilder.from(foundEmbed);
            updatedEmbed.data.fields = updatedEmbed.data.fields.map(f => {
                if (f.name === "Attempts") return { name: "Attempts", value: `${newAttempts}`, inline: true };
                return f;
            });

            // EDIT THE MESSAGE
            await foundMessage.edit({ embeds: [updatedEmbed] }).catch(console.error);

            // LOG EDIT
            const logEmbed = new EmbedBuilder()
                .setTitle("Attempts Edited")
                .setColor(0xFFAA00)
                .setDescription(
                    `<@${editor.id}> edited <@${target.id}>'s attempts\n\n` +
                    `**Before:** ${oldAttempts}\n` +
                    `**Now:** ${newAttempts}`
                )
                .setFooter({ text: "NYCRP Management" });

            const logChannel = interaction.guild.channels.cache.get("1290085309190504461");
            if (logChannel) logChannel.send({ embeds: [logEmbed] }).catch(() => {});

            // CONFIRM TO INTERACTION
            await interaction.reply({
                content: "<:Check:1478581031971061983> Attempts successfully updated.",
                ephemeral: true
            });

        } catch (err) {
            console.error("tattempts command error:", err);
        }
    }
};
