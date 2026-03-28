const { SlashCommandBuilder } = require("discord.js");

const activePings = new Map(); // userId -> interval

const OWNER_ID = "942789806818213949";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pinguser")
        .setDescription("Ping a user 100 times or stop it")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("User to ping")
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName("toggle")
                .setDescription("True = start | False = stop")
                .setRequired(true)
        ),

    run: async (interaction, client) => {
        try {

            // 🔒 Restrict to specific user
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({
                    content: "You are not allowed to use this command.",
                    ephemeral: true
                });
            }

            const target = interaction.options.getUser("target");
            const toggle = interaction.options.getBoolean("toggle");

            // STOP LOGIC
            if (!toggle) {
                if (activePings.has(target.id)) {
                    clearInterval(activePings.get(target.id));
                    activePings.delete(target.id);
                    return interaction.reply({
                        content: `Stopped pinging ${target}.`,
                        ephemeral: true
                    });
                } else {
                    return interaction.reply({
                        content: `No active ping running for ${target}.`,
                        ephemeral: true
                    });
                }
            }

            // PREVENT DUPLICATE
            if (activePings.has(target.id)) {
                return interaction.reply({
                    content: `Already pinging ${target}. Use false to stop it.`,
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: `Starting 100 pings for ${target}...`,
                ephemeral: true
            });

            let count = 0;

            const interval = setInterval(async () => {
                if (count >= 100) {
                    clearInterval(interval);
                    activePings.delete(target.id);
                    return;
                }

                count++;

                interaction.channel.send(`${target}`);

            }, 0); // fastest possible

            activePings.set(target.id, interval);

        } catch (err) {
            console.error("PingUser command error:", err);
            if (!interaction.replied) {
                interaction.reply({ content: "Something went wrong.", ephemeral: true });
            }
        }
    }
};