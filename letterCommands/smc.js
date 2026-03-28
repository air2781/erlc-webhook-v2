const { EmbedBuilder } = require("discord.js");

const severeWords = [
    "nigger", "nigga",
    "rape", "raping", "rapist", "porn", "pornhub", "stripclub", "striper",
    "faggot", "fag",
    "racist", "coon", "monkey",
    "kike", "tranny", "retard",
    "spic", "chink"
];

const cooldowns = new Set();

module.exports = {
    name: "smc",
    run: async (client, message, args) => {
        if (cooldowns.has(message.author.id)) {
            return message.reply("You must wait 5 seconds before running this again.").then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }
        cooldowns.add(message.author.id);
        setTimeout(() => cooldowns.delete(message.author.id), 5000);

        // Permissions: owner or admin
        if (message.author.id !== "942789806818213949" && !message.member.permissions.has("Administrator")) return;

        await message.delete().catch(() => {});

        let totalFound = 0;
        let totalProcessed = 0;
        const offendingMessages = [];

        const progressMsg = await message.channel.send("0 found. (0/1000)").catch(() => null);
        if (!progressMsg) return;

        let lastId = null;

        for (let i = 0; i < 10; i++) { // 10 batches = 1000 messages
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await message.channel.messages.fetch(options).catch(() => new Map());
            if (!messages || messages.size === 0) break;

            lastId = messages.last().id;

            for (const msg of messages.values()) {
                if (!msg.content || msg.author.bot) continue;

                const foundWord = severeWords.find(w => msg.content.toLowerCase().includes(w));
                if (foundWord) {
                    totalFound++;
                    offendingMessages.push({
                        user: msg.author,
                        time: msg.createdAt,
                        word: foundWord,
                        url: msg.url
                    });
                }

                totalProcessed++;
            }

            // Update progress message safely
            try {
                await progressMsg.edit(`${totalFound} found. (${totalProcessed}/1000)`).catch(() => {});
            } catch {}
            await new Promise(res => setTimeout(res, 300)); // small delay to reduce API pressure
        }

        // Final update
        try {
            await progressMsg.edit(`In total **${totalFound}** was found. To check the messages, see <#1290085309190504461>`).catch(() => {});
        } catch {}

        if (offendingMessages.length === 0) return;

        const embed = new EmbedBuilder()
            .setTitle("SMC Messages Found")
            .setColor("Yellow")
            .setFooter({ text: `Command ran by ${message.author.tag} | ${new Date().toLocaleString()}` });

        let description = "";
        offendingMessages.forEach((m, index) => {
            description += `**${m.user.tag}** [${m.time.toLocaleString()}]: ${m.word}\n-# [Jump to message](${m.url})\n`;
        });
        embed.setDescription(description);

        const logChannel = await client.channels.fetch("1290085309190504461").catch(() => null);
        if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
