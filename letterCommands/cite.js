const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require("../Config");

const TRAFFIC_PATH = path.join(__dirname, "../trafficusers.json");

if (!fs.existsSync(TRAFFIC_PATH)) {
    fs.writeFileSync(TRAFFIC_PATH, JSON.stringify({}, null, 2));
}

// GLOBAL COMMAND QUEUE (prevents ERLC dropping commands)
let commandQueue = Promise.resolve();

const sendCommand = (cmd) => {
    commandQueue = commandQueue.then(async () => {
        try {
            const response = await fetch(`${config.erlc.baseUrl}/v1/server/command`, {
                method: "POST",
                headers: {
                    "server-key": config.erlc.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ command: cmd })
            });

            // 1.2 second buffer to prevent API flooding
            await new Promise(res => setTimeout(res, 1200));

            return response.ok;

        } catch (err) {
            console.log("Command failed:", err);
            return false;
        }
    });

    return commandQueue;
};

module.exports = {
    name: "cite",
    run: async (client, message, args) => {

        // Only you can use it
        if (message.author.id !== "942789806818213949") return;

        if (!args[0]) return message.reply("Provide a username.");

        const input = args[0].toLowerCase();

        // Fetch ERLC players
        let players = [];
        try {
            const res = await fetch(`${config.erlc.baseUrl}/v2/server?Players=true`, {
                headers: { "server-key": config.erlc.apiKey }
            });

            if (!res.ok) return message.reply("Failed to fetch server players.");

            const data = await res.json();
            players = data.Players || [];

        } catch {
            return message.reply("Failed to fetch players.");
        }

        if (!players.length) return message.reply("No players found.");

        // Partial match support
        const matches = players.filter(p =>
            p.Player.split(":")[0].toLowerCase().includes(input)
        );

        if (!matches.length) return message.reply("User not found in-game.");

        // Random pick if multiple
        const target = matches[Math.floor(Math.random() * matches.length)];
        const username = target.Player.split(":")[0];

        // Load citation data
        const trafficData = JSON.parse(fs.readFileSync(TRAFFIC_PATH));
        if (!trafficData[username]) trafficData[username] = 0;

        trafficData[username] += 1;
        const count = trafficData[username];

        // FIRST CITATION
        if (count === 1) {

            await sendCommand(
                `:pm ${username} Cited By Officer: You have been cited by a officer in a speed-checker car. If you continue to break traffic laws, you may be autojailed.`
            );

            message.reply(`Cited ${username} (1/3)`);
        }

        // SECOND CITATION
        else if (count === 2) {

            await sendCommand(
                `:pm ${username} Cited By Officer: You have been cited by a officer in a speed-checker car. This is your final warning. If you break traffic laws once more, you will be auto-jailed.`
            );

            message.reply(`Cited ${username} (2/3)`);
        }

        // THIRD CITATION → JAIL
        else if (count >= 3) {

            const jailSuccess = await sendCommand(`:jail ${username}`);

            if (!jailSuccess) {
                trafficData[username] -= 1;
                fs.writeFileSync(TRAFFIC_PATH, JSON.stringify(trafficData, null, 2));
                return message.reply(`Failed to jail ${username}. Citation not counted.`);
            }

            await sendCommand(
                `:pm ${username} Max Citations Reached: You have broken multiple traffic laws regardless of the warnings, therefore you have been jailed. Your citations limit has been reset once your out of jail.`
            );

            trafficData[username] = 0;

            message.reply(`<:Check:1473547604921942046> ${username} jailed successfully (3/3) — citations reset.`);
        }

        fs.writeFileSync(TRAFFIC_PATH, JSON.stringify(trafficData, null, 2));
    }
};