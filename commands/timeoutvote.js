const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

// Active votes per message
const ACTIVE_VOTES = new Map();
// Active vote per channel
const ACTIVE_CHANNEL_VOTES = new Map();
// User vote limits (3 votes per 12 hours)
const USER_VOTE_COUNT = new Map();
// Cooldown for starting votes (2 minutes)
const USER_VOTE_COOLDOWN = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeoutvote")
        .setDescription("Start a moderation timeout vote for a user.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to vote to timeout")
                .setRequired(true)),

    async run(interaction) {
        const voter = interaction.user;
        const target = interaction.options.getUser("user");

        if (!target) return interaction.reply({ content: "> You must specify a user to vote for.", ephemeral: true });
        if (target.bot) return interaction.reply({ content: "> You cannot vote to timeout a bot.", ephemeral: true });
        if (target.id === voter.id) return interaction.reply({ content: "> You cannot vote on yourself.", ephemeral: true });

        const channelId = interaction.channel.id;

        if (ACTIVE_CHANNEL_VOTES.has(channelId)) {
            return interaction.reply({ content: "> A vote is already active in this channel.", ephemeral: true });
        }

        const now = Date.now();

        // 2-minute cooldown for starting vote
        const lastVote = USER_VOTE_COOLDOWN.get(voter.id) || 0;
        if (now - lastVote < 2 * 60 * 1000) {
            return interaction.reply({ content: "> You must wait 2 minutes before starting another vote.", ephemeral: true });
        }
        USER_VOTE_COOLDOWN.set(voter.id, now);

        // 3 votes per 12 hours
        const votes = USER_VOTE_COUNT.get(voter.id) || [];
        const recentVotes = votes.filter(t => now - t < 12 * 60 * 60 * 1000);
        if (recentVotes.length >= 3) {
            return interaction.reply({ content: "> You have reached your 3 votes limit in 12 hours.", ephemeral: true });
        }
        recentVotes.push(now);
        USER_VOTE_COUNT.set(voter.id, recentVotes);

        const APPROVED_ROLEs = ["1314418348729040946", "1290085306489639026", "1374598529494028398"];

        // Initial embed
        const embed = new EmbedBuilder()
            .setTitle("Moderation Timeout Vote (30)")
            .setColor("Yellow")
            .setDescription(`> ${voter} has requested a timeout for ${target}.\n> 3 votes needed to pass within 30 seconds.\n\n**Requirements:**\n> A Game Moderation or Trusted role must vote.`)
            .setFooter({ text: `New York Management | ${new Date().toLocaleString()}` });

        const yesButton = new ButtonBuilder().setCustomId("vote_yes").setLabel("Yes (0)").setStyle(ButtonStyle.Success);
        const noButton = new ButtonBuilder().setCustomId("vote_no").setLabel("No (0)").setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        let voteMessage;
        try {
            voteMessage = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        } catch (err) {
            console.error("Failed to send vote message:", err);
            return;
        }

        ACTIVE_CHANNEL_VOTES.set(channelId, voteMessage.id);
        ACTIVE_VOTES.set(voteMessage.id, {
            targetId: target.id,
            votes: {},
            yes: 0,
            no: 0,
            startedAt: Date.now(),
            duration: 30,
            message: voteMessage,
            issuer: voter.id,
            lastClick: {},
            collector: null
        });

        const data = ACTIVE_VOTES.get(voteMessage.id);

        // Button collector
        const collector = voteMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: data.duration * 1000
        });
        data.collector = collector;

        collector.on("collect", async i => {
            const userId = i.user.id;

            try {
                // Cannot vote on self
                if (userId === data.targetId) {
                    return i.followUp?.({ content: "> You cannot vote on yourself.", ephemeral: true }).catch(() => {});
                }

                // 3-second cooldown
                if (data.lastClick[userId] && Date.now() - data.lastClick[userId] < 3000) {
                    return i.followUp?.({ content: "> Wait 3 seconds before voting again.", ephemeral: true }).catch(() => {});
                }
                data.lastClick[userId] = Date.now();

                const choice = i.customId === "vote_yes" ? "yes" : "no";
                const prevVote = data.votes[userId];

                // Ignore same vote
                if (prevVote === choice) return i.deferUpdate().catch(() => {});

                // Remove previous vote
                if (prevVote === "yes") data.yes--;
                if (prevVote === "no") data.no--;

                // Apply new vote
                data.votes[userId] = choice;
                if (choice === "yes") data.yes++;
                if (choice === "no") data.no++;

                // Update buttons only
                const updatedRow = new ActionRowBuilder().addComponents(
                    ButtonBuilder.from(yesButton).setLabel(`Yes (${data.yes})`),
                    ButtonBuilder.from(noButton).setLabel(`No (${data.no})`)
                );

                await i.update({ components: [updatedRow] }).catch(() => {});
            } catch (err) {
                console.error("Button interaction error:", err);
            }
        });

        // Timer tick every 10 seconds
        const intervalId = setInterval(async () => {
            const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
            const remaining = data.duration - elapsed;

            if (remaining <= 0) {
                clearInterval(intervalId);
                if (!collector.ended) collector.stop("time_up");
                return;
            }

            if (remaining % 10 === 0 || remaining < 10) {
                const newEmbed = EmbedBuilder.from(data.message.embeds[0]);
                newEmbed.setTitle(`Moderation Timeout Vote (${remaining})`);
                await data.message.edit({ embeds: [newEmbed] }).catch(() => {});
            }
        }, 1000);

        collector.on("end", async () => {
            const yesCount = data.yes;
            const noCount = data.no;
            const yesVoters = Object.keys(data.votes).filter(uid => data.votes[uid] === "yes");
            const noVoters = Object.keys(data.votes).filter(uid => data.votes[uid] === "no");

            const trustedVoted = yesVoters.some(uid => {
                const member = interaction.guild.members.cache.get(uid);
                return member?.roles.cache.some(r => APPROVED_ROLEs.includes(r.id));
            });

            const member = interaction.guild.members.cache.get(data.targetId);
            let resultText = "";
            let timedOut = false;

            if (yesCount >= 3 && yesCount > noCount && trustedVoted) {
                if (member && member.moderatable) {
                    await member.timeout(5 * 60 * 1000, "Vote passed");
                    try { await member.send(`> You have been timed out for 5 minutes by a vote from <@${data.issuer}>.`); } catch {}
                    resultText = "The user was timed out. Vote passed.";
                    timedOut = true;
                } else {
                    resultText = "<:ErrorX:1473547704444653568> Vote failed. Bot cannot timeout this user.";
                }
            } else {
                resultText = "<:ErrorX:1473547704444653568> Vote failed. Requirements not met (Trusted/Game Moderation needed or votes insufficient).";
            }

            const concludedEmbed = EmbedBuilder.from(data.message.embeds[0])
                .setTitle("Moderation Timeout Vote (Concluded)")
                .setDescription(`> ${resultText}`)
                .setColor("Yellow");

            await data.message.edit({ embeds: [concludedEmbed], components: [] }).catch(() => {});

            // Clean up
            ACTIVE_VOTES.delete(voteMessage.id);
            ACTIVE_CHANNEL_VOTES.delete(channelId);
        });
    }
};
