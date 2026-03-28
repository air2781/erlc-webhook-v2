const fs = require("fs");
const path = require("path");

const CASE_FILE = path.join(__dirname, "../Gamecases.json");

const REPORT_CHANNEL_ID = "1424290893258817536";
const LOG_CHANNEL_ID = "1312842507436167234";

function loadCases() {
    if (!fs.existsSync(CASE_FILE)) {
        fs.writeFileSync(CASE_FILE, JSON.stringify({ cases: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(CASE_FILE, "utf8"));
}

function saveCases(data) {
    fs.writeFileSync(CASE_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "voidcase",
    run: async (client, message, args) => {
        if (message.guild) return; // DM only

        const caseId = args[0];
        if (!caseId) return message.reply("<:ErrorX:1473547704444653568> Provide a Case ID.");

        const data = loadCases();
        const index = data.cases.findIndex(c => c.id === caseId);

        if (index === -1)
            return message.reply("<:ErrorX:1473547704444653568> Case not found.");

        const found = data.cases[index];

        if (found.status !== "pending")
            return message.reply("<:ErrorX:1473547704444653568> This case has already been handled.");

        const THREE_HOURS = 3 * 60 * 60 * 1000;
        if (Date.now() - found.timestamp > THREE_HOURS)
            return message.reply("<:ErrorX:1473547704444653568> Time limit expired. You cannot void this case.");

        try {
            const channel = await client.channels.fetch(REPORT_CHANNEL_ID);
            const msg = await channel.messages.fetch(found.messageId);
            await msg.delete();
        } catch {
            return message.reply("<:ErrorX:1473547704444653568> Could not delete report (already removed or missing).");
        }

        data.cases.splice(index, 1);
        saveCases(data);

        await message.reply("<:Check:1478581031971061983> Successfully voided your report.");

        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
            const timestamp = new Date().toLocaleString("en-CA", {
                timeZone: "America/Toronto",
                hour12: false
            });

            logChannel.send(
                `${message.author} (${message.author.id}) ran ?voidcase ${caseId} at ${timestamp}`
            );
        }
    }
};
