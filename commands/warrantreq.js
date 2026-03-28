const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

const WARRANT_LOG_PATH = path.join(__dirname, "../warrantlogs.json");
if (!fs.existsSync(WARRANT_LOG_PATH)) fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify([]));

const ALLOWED_ROLES = [
    "1290085306489639026",
    "1313304471937220708",
    "1330398732679643296"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warrantrequest")
        .setDescription("Submit a new warrant request")
        .addStringOption(opt =>
            opt.setName("username")
                .setDescription("Roblox Username")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("department")
                .setDescription("Department Issuing")
                .setRequired(true)
                .addChoices(
                    { name: "NYPD", value: "NYPD" },
                    { name: "FBI", value: "FBI" },
                    { name: "DOT", value: "DOT" },
                    { name: "NYFD", value: "NYFD" },
                    { name: "NYSP", value: "NYSP" },
                    { name: "NYSO", value: "NYSO" },
                    { name: "NYC Services", value: "NYC Services" }
                ))
        .addStringOption(opt =>
            opt.setName("reason")
                .setDescription("Reason")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("danger")
                .setDescription("Danger Level")
                .setRequired(true)
                .addChoices(
                    { name: "KOS", value: "KOS" },
                    { name: "Critical", value: "Critical" },
                    { name: "Intermediate", value: "Intermediate" },
                    { name: "Civil", value: "Civil" }
                ))
        .addStringOption(opt =>
            opt.setName("notes")
                .setDescription("Additional Notes")
                .setRequired(false)),

    run: async (interaction) => {

        const memberRoles = interaction.member.roles.cache.map(r => r.id);
        const hasPerm = interaction.member.permissions.has("Administrator") ||
            memberRoles.some(r => ALLOWED_ROLES.includes(r));

        if (!hasPerm)
            return interaction.reply({ content: "<:ErrorX:1473547704444653568> You do not have permission.", ephemeral: true });

        const username = interaction.options.getString("username");
        const department = interaction.options.getString("department");
        const reason = interaction.options.getString("reason");
        const danger = interaction.options.getString("danger");
        const notes = interaction.options.getString("notes") || "None";

        // 🔎 Get Roblox User ID
        let userId;
        let avatarUrl = null;

        try {
            const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernames: [username] })
            });

            const userData = await userRes.json();
            if (!userData.data || !userData.data.length)
                return interaction.reply({ content: "<:ErrorX:1473547704444653568> Roblox user not found.", ephemeral: true });

            userId = userData.data[0].id;

            // 🖼 Get avatar thumbnail
            const thumbRes = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
            );

            const thumbData = await thumbRes.json();
            avatarUrl = thumbData.data[0]?.imageUrl;

        } catch (err) {
            console.error("Roblox API Error:", err);
        }

        // Generate random code
        const code = Math.random().toString(36).slice(2, 12).toUpperCase();

        const warrants = JSON.parse(fs.readFileSync(WARRANT_LOG_PATH, "utf-8"));

        warrants.push({
            username,
            userId,
            code,
            reason,
            notes,
            issuedBy: interaction.user.id,
            department,
            dangerLevel: danger,
            status: "Courthouse/Judge still reviewing or unchecked...",
            createdAt: Date.now()
        });

        fs.writeFileSync(WARRANT_LOG_PATH, JSON.stringify(warrants, null, 2));

        const embed = new EmbedBuilder()
            .setTitle(`Warrant Request | ${username}`)
            .setDescription(
                `**Department:** ${department}\n` +
                `**Danger Level:** ${danger}\n` +
                `**Reason:** ${reason}\n` +
                `**Notes:** ${notes}\n` +
                `**Requested by:** ${interaction.user}`
            )
            .setFooter({ text: `Warrant Code: ${code}` })
            .setColor("Yellow")
            .setTimestamp();

        if (avatarUrl) embed.setThumbnail(avatarUrl);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`warrant_request_${code}`)
                .setLabel("Request Warrant")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`warrant_cancel_${code}`)
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};