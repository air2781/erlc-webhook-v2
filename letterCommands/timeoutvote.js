const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

const LOG_CHANNEL_ID = "1290085309190504461";

// Active votes per message
const ACTIVE_VOTES = new Map();
// Active vote per channel
const ACTIVE_CHANNEL_VOTES = new Map();
// User vote limits (3 votes per 12 hours)
const USER_VOTE_COUNT = new Map();
// Cooldown for starting votes (2 minutes)
const USER_VOTE_COOLDOWN = new Map();

module.exports = {
  name: "timeoutvote",

  run: async (client, message, args) => {
    const voter = message.author;

    const target =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!target)
      return message.channel.send("> <:Error:1467240551681360086> You must specify a user to vote for.");

    if (target.bot)
      return message.channel.send("> <:X_:1467240500913246461> You cannot vote to timeout a bot.");

    if (target.id === voter.id)
      return message.channel.send("> <:X_:1467240500913246461> You cannot vote on yourself.");

    const channelId = message.channel.id;

    if (ACTIVE_CHANNEL_VOTES.has(channelId)) {
      return message.channel.send("> <:X_:1467240500913246461> A vote is already active in this channel.");
    }

    const now = Date.now();

    const lastVote = USER_VOTE_COOLDOWN.get(voter.id) || 0;
    if (now - lastVote < 2 * 60 * 1000) {
      return message.channel.send("> <:X_:1467240500913246461> You must wait 2 minutes before starting another vote.");
    }
    USER_VOTE_COOLDOWN.set(voter.id, now);

    const votes = USER_VOTE_COUNT.get(voter.id) || [];
    const recentVotes = votes.filter(t => now - t < 12 * 60 * 60 * 1000);
    if (recentVotes.length >= 3) {
      return message.channel.send("> <:X_:1467240500913246461> You have reached your 3 votes limit in 12 hours.");
    }
    recentVotes.push(now);
    USER_VOTE_COUNT.set(voter.id, recentVotes);

    const APPROVED_ROLES = [
      "1314418348729040946",
      "1290085306489639026",
      "1374598529494028398"
    ];

    const embed = new EmbedBuilder()
      .setTitle("Moderation Timeout Vote (30)")
      .setColor("Yellow")
      .setDescription(
        `> ${voter} has requested a timeout for ${target}.\n` +
        `> **3 YES votes** required within **30 seconds**.\n\n` +
        `**Requirements:**\n> Trusted / Game Moderation role required.`
      )
      .setFooter({ text: `New York Management | ${new Date().toLocaleString()}` });

    const yesButton = new ButtonBuilder()
      .setCustomId("vote_yes")
      .setLabel("Yes (0)")
      .setStyle(ButtonStyle.Success);

    const noButton = new ButtonBuilder()
      .setCustomId("vote_no")
      .setLabel("No (0)")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(yesButton, noButton);

    const voteMessage = await message.channel.send({
      embeds: [embed],
      components: [row]
    });

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

    const collector = voteMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: data.duration * 1000
    });

    data.collector = collector;

    collector.on("collect", async i => {
      const userId = i.user.id;

      if (userId === data.targetId) {
        return i.reply({
          content: "> <:X_:1467240500913246461> You cannot vote on yourself.",
          ephemeral: true
        }).catch(() => {});
      }

      if (data.lastClick[userId] && Date.now() - data.lastClick[userId] < 3000) {
        return i.reply({
          content: "> <:X_:1467240500913246461> Wait 3 seconds before voting again.",
          ephemeral: true
        }).catch(() => {});
      }

      data.lastClick[userId] = Date.now();

      const choice = i.customId === "vote_yes" ? "yes" : "no";
      const prevVote = data.votes[userId];

      if (prevVote === choice) return i.deferUpdate().catch(() => {});

      if (prevVote === "yes") data.yes--;
      if (prevVote === "no") data.no--;

      data.votes[userId] = choice;
      if (choice === "yes") data.yes++;
      if (choice === "no") data.no++;

      const updatedRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(yesButton).setLabel(`Yes (${data.yes})`),
        ButtonBuilder.from(noButton).setLabel(`No (${data.no})`)
      );

      await i.update({ components: [updatedRow] }).catch(() => {});
    });

    collector.on("end", async () => {
      const yesVoters = Object.keys(data.votes).filter(uid => data.votes[uid] === "yes");
      const noVoters = Object.keys(data.votes).filter(uid => data.votes[uid] === "no");

      const trustedVoted = yesVoters.some(uid => {
        const member = message.guild.members.cache.get(uid);
        return member?.roles.cache.some(r => APPROVED_ROLES.includes(r.id));
      });

      const member = message.guild.members.cache.get(data.targetId);
      let passed = false;
      let resultText = "";

      if (data.yes >= 3 && data.yes > data.no && trustedVoted) {
        passed = true;
        if (member?.moderatable) {
          await member.timeout(5 * 60 * 1000, "Vote passed");
        }
        resultText = "Vote **PASSED** — user was timed out.";
      } else {
        resultText = "Vote **FAILED** — requirements not met.";
      }

      const concludedEmbed = EmbedBuilder.from(data.message.embeds[0])
        .setTitle("Moderation Timeout Vote (Concluded)")
        .setDescription(`> ${resultText}`)
        .setColor("Yellow");

      await data.message.edit({ embeds: [concludedEmbed], components: [] }).catch(() => {});

      const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle("🗳️ Timeout Vote Log")
          .setColor(passed ? "Green" : "Red")
          .addFields(
            { name: "Target", value: `<@${data.targetId}>`, inline: true },
            { name: "Issuer", value: `<@${data.issuer}>`, inline: true },
            { name: "Result", value: passed ? "PASSED" : "FAILED", inline: true },
            { name: "Yes Votes", value: yesVoters.map(id => `<@${id}>`).join(", ") || "None" },
            { name: "No Votes", value: noVoters.map(id => `<@${id}>`).join(", ") || "None" }
          )
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }

      ACTIVE_VOTES.delete(voteMessage.id);
      ACTIVE_CHANNEL_VOTES.delete(channelId);
    });
  }
};
