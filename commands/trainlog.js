const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// Path to JSON storage
const storagePath = path.join(__dirname, "traininglogs.json");
const REVIEW_CHANNEL = "1455388497065279630";
const MAIN_LOG_CHANNEL = "1313633542055399545"; // main logs
const APPROVED_CHANNEL = "1290085309190504461"; // approved logs
const STAFF_PROMO_CHANNEL = "1290085308469346317"; // promotion logs

// Utility to load or initialize JSON
async function loadLogs() {
    if (!fs.existsSync(storagePath)) return { trainings: [] };
    const file = await fs.promises.readFile(storagePath, "utf8");
    return JSON.parse(file);
}

async function saveLogs(data) {
    await fs.promises.writeFile(storagePath, JSON.stringify(data, null, 2));
}

// Utility to generate unique 4-digit ID
function generateTrainingID(existingIDs) {
    let id;
    do {
        id = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existingIDs.includes(id));
    return id;
}

// Greeting embed
async function sendGreeting(interaction, traineeUser) {
    let nickname = traineeUser.username;
    if (nickname.length > 25) nickname = "Trainee";

    const embed = new EmbedBuilder()
        .setTitle(`Welcome, ${nickname}`)
        .setDescription(
`> We are so excited and glad to have you here after all of that hard work to be at your position! I will be explaining some information below to help you get started.

**Melonly:** We use the Melonly bot as our vital resource in logging, making moderations, and configuration for staff needs. Commands include /logs create, /shift manage, mod-panel, etc.

**Moderations:** Rules violations are either kick or ban. Warnings are optional, max 2. If server population drops below 35, kicks become jails, bans become kicks, serious bans remain.

**Support System:** For infractions or inquiries, use the ticket system in the main server.

**Moderation Protection:** Moderation Protect has been updated and changed as of 2025 December. Please review the current and most updated staff guide for more information.`
        )
        .setImage("https://media.discordapp.net/attachments/1403121292382703726/1418997687663198409/image.png?ex=690f7014&is=690e1e94&hm=afda5b32c1f1ac408981a5428036b1ec16d239336a338e61a367af21ef07d931&=&format=webp&quality=lossless&width=2784&height=834")
        .setFooter({
            text: `Sent by ${interaction.user.tag} | ${new Date().toLocaleString()}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setColor(0x3498db);

    try {
        await traineeUser.send({ embeds: [embed] });
    } catch (err) {
        console.error(`Could not DM ${traineeUser.tag}:`, err);
    }
}

async function sendForReview(guild, embed) {
    const channel = guild.channels.cache.get(REVIEW_CHANNEL);
    if (!channel) return;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("log_ignore")
            .setLabel("Ignore")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("log_investigate")
            .setLabel("Issue Investigation")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        embeds: [embed],
        components: [row]
    });
}


/// EXPORT EVERYTHING + COMMAND
module.exports = {
    loadLogs,
    saveLogs,
    generateTrainingID,
    sendGreeting,

    data: new SlashCommandBuilder()
        .setName("trainlog")
        .setDescription("Log a trainee's training.")
        .addUserOption(opt =>
            opt.setName("user")
                .setDescription("The trainee being logged")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("type")
                .setDescription("Training type")
                .setRequired(true)
                .addChoices(
                    { name: "STP1", value: "STP1" },
                    { name: "STP2", value: "STP2" }
                ))
        .addStringOption(opt =>
            opt.setName("reason")
                .setDescription("Reason for pass/fail")
                .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName("percentage")
                .setDescription("Training score percentage")
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName("recommendation")
                .setDescription("Optional recommendation (STP2 only)")
                .setRequired(false)
                .addChoices(
                    { name: "DS", value: "DS" },
                    { name: "IAD", value: "IAD" },
                    { name: "HR Needed", value: "HR" }
                )),

    run: async (interaction) => {

        // PERMISSION CHECK
        if (
            !interaction.member.roles.cache.has("1373024734010282044") &&
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return interaction.reply({
                content: "<a:red:1454668684411928627> You do not have permission to run this command.",
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const trainer = interaction.member;
        const trainee = interaction.options.getUser("user");
        const type = interaction.options.getString("type");
        let reason = interaction.options.getString("reason");
        let percentage = interaction.options.getInteger("percentage");
        let recommendation = interaction.options.getString("recommendation");

        if (reason.length > 1024) {
            return interaction.editReply({ content: "<a:red:1454668684411928627> Reason too long (1024 max)." });
        }

        percentage = Math.max(0, Math.min(100, Math.round(percentage)));
        if (type === "STP1") recommendation = null;

        const status = (type === "STP1" ? percentage >= 80 : percentage >= 90) ? "Pass" : "Fail";

        const data = await loadLogs();
        const trainingID = generateTrainingID(data.trainings.map(t => t.id));

        // 🔢 STP2 ATTEMPT TRACKING (ONLY STP2)
        let attempts = null;
        if (type === "STP2") {
            attempts = data.trainings.filter(t =>
                t.userId === trainee.id && t.type === "STP2"
            ).length + 1;
        }

        const logEmbed = new EmbedBuilder()
            .setTitle(`Training Log | ${type}`)
            .setColor(status === "Pass" ? 0x56f288 : 0xff0000)
            .addFields(
                { name: "User", value: `<@${trainee.id}>`, inline: true },
                { name: "Trainer", value: `<@${trainer.id}>`, inline: true },
                { name: "Training ID", value: trainingID, inline: true },
                { name: "Percentage", value: `${percentage}%`, inline: true },
                { name: "Status", value: status, inline: true },
                ...(type === "STP2" ? [{ name: "Attempts", value: `${attempts}`, inline: true }] : []),
                { name: "Reason", value: reason }
            )
            .setFooter({ text: `Logged at ${new Date().toLocaleString()}` });

        const logChannel = await interaction.guild.channels.fetch("1313633542055399545");
        if (logChannel) await logChannel.send({ embeds: [logEmbed] });

        await sendForReview(interaction.guild, logEmbed);

        if (status === "Pass" && type === "STP1") {
            try { await sendGreeting(interaction, trainee); } 
            catch (err) { console.error(`Failed to send greeting to ${trainee.tag}:`, err); }
        }

        const promoChannel = interaction.guild.channels.cache.get("1290085308469346317");
        if (status === "Pass" && promoChannel) {
            setTimeout(async () => {
                const memberObj = interaction.guild.members.cache.get(trainee.id);
                if (!memberObj) return;

                if (type === "STP1") {
                    await memberObj.roles.remove(["1312852163000664175"]).catch(() => {});
                    await memberObj.roles.add([
                        "1312852212304707656",
                        "1290085306489639026",
                        "1290085306598559817",
                        "1290085306598559818"
                    ]).catch(() => {});
                } else {
                    await memberObj.roles.add(["1290085306598559820", "1312852754233823423"]).catch(() => {});
                    await memberObj.roles.remove(["1312852671178211409"]).catch(() => {});
                }
            }, 2000);

            const promoEmbed = new EmbedBuilder()
                .setAuthor({ name: trainer.user.username, iconURL: trainer.user.displayAvatarURL() })
                .setTitle("Staff Promotion")
                .setDescription(
                    `The High Ranking Team has noticed your contributions towards ${interaction.guild.name}!\n` +
                    `You've been issued a promotion. Congratulations!`
                )
                .addFields(
                    { name: "User:", value: `<@${trainee.id}>`, inline: false },
                    { name: "New Rank:", value: type === "STP1" ? "Junior Moderator" : "Junior Administrator", inline: false },
                    { name: "Reason:", value: "Passed Staff Training.", inline: false },
                    { name: "Note(s):", value: "No additional notes.", inline: false }
                )
                .setImage("https://media.discordapp.net/attachments/1316555904640090113/1323424470831988866/Screenshot_2024-10-27_at_9.png?ex=69545895&is=69530715&hm=f3a3cbca5b425cc5ceab12f87532c98f0508cb33f174b8fc768210c33623ecf2&=&format=webp&quality=lossless&width=2774&height=722")
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: `Issued by: ${trainer.user.username}` })
                .setColor(0x58B9FF);

            await promoChannel.send({ embeds: [promoEmbed] });
        }

        try { await trainee.send({ embeds: [EmbedBuilder.from(logEmbed)] }); } catch {}

        data.trainings.push({
            id: trainingID,
            userId: trainee.id,
            trainerId: trainer.id,
            type,
            reason,
            percentage,
            status,
            recommendation,
            attempts: type === "STP2" ? attempts : null,
            timestamp: new Date().toISOString()
        });

        saveLogs(data);

        await interaction.editReply({
            content: `<:Check:1478581031971061983> Training logged for **${trainee.username}**.`
        });
    }
};