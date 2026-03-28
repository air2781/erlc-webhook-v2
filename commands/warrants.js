const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const WARRANT_LOG_PATH = path.join(__dirname, "../warrantlogs.json");

const ALLOWED_ROLES = [
    "1290085306489639026",
    "1313304471937220708",
    "1330398732679643296"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warrants")
        .setDescription("View all active warrants"),

    run: async (interaction) => {

        const memberRoles = interaction.member.roles.cache.map(r => r.id);
        const hasPerm = interaction.member.permissions.has("Administrator") ||
            memberRoles.some(r => ALLOWED_ROLES.includes(r));

        if (!hasPerm)
            return interaction.reply({ content: "<:ErrorX:1473547704444653568> You do not have permission.", ephemeral: true });

        if (!fs.existsSync(WARRANT_LOG_PATH))
            return interaction.reply({ content: "No warrants found.", ephemeral: true });

        const warrants = JSON.parse(fs.readFileSync(WARRANT_LOG_PATH, "utf-8"));

        if (!warrants.length)
            return interaction.reply({ content: "No warrants available.", ephemeral: true });

        const perPage = 4;
        let page = 0;
        const totalPages = Math.ceil(warrants.length / perPage);

        const generateEmbed = (pageIndex) => {
            const start = pageIndex * perPage;
            const current = warrants.slice(start, start + perPage);

            const embed = new EmbedBuilder()
                .setTitle("Active Warrants")
                .setColor("Yellow")
                .setFooter({ text: `Page ${pageIndex + 1} / ${totalPages}` })
                .setTimestamp();

            current.forEach((w, i) => {
                embed.addFields({
                    name: `Warrant #${start + i + 1}`,
                    value:
                        `**Username:** ${w.username}\n` +
                        `**Department:** ${w.department}\n` +
                        `**Danger Level:** ${w.dangerLevel}\n` +
                        `**Reason:** ${w.reason}\n` +
                        `**Status:** ${w.status}\n` +
                        `**Code:** ${w.code}`
                });
            });

            return embed;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("warrants_back")
                .setLabel("Back")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("warrants_forward")
                .setLabel("Forward")
                .setStyle(ButtonStyle.Secondary)
        );

        const message = await interaction.reply({
            embeds: [generateEmbed(page)],
            components: totalPages > 1 ? [row] : [],
            fetchReply: true
        });

        if (totalPages <= 1) return;

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000
        });

        let lastClick = 0;

        collector.on("collect", async (btn) => {

            if (btn.user.id !== interaction.user.id)
                return btn.reply({ content: "<:ErrorX:1473547704444653568> You cannot use these buttons.", ephemeral: true });

            const now = Date.now();
            if (now - lastClick < 2000)
                return btn.reply({ content: "<:Limited:1473547648068747399> Slow down.", ephemeral: true });

            lastClick = now;

            if (btn.customId === "warrants_back") {
                page = page > 0 ? page - 1 : totalPages - 1;
            }

            if (btn.customId === "warrants_forward") {
                page = page + 1 < totalPages ? page + 1 : 0;
            }

            await btn.update({
                embeds: [generateEmbed(page)],
                components: [row]
            });
        });

        collector.on("end", async () => {
            await message.edit({ components: [] }).catch(() => {});
        });
    }
};