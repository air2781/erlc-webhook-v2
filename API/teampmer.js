const fetch = require("node-fetch");
const config = require("../Config");

// Command queue (prevents ERLC dropping commands)
let commandQueue = Promise.resolve();

const sendCommand = (cmd) => {
    commandQueue = commandQueue.then(async () => {
        try {
            await fetch(`${config.erlc.baseUrl}/v1/server/command`, {
                method: "POST",
                headers: {
                    "server-key": config.erlc.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ command: cmd })
            });

            // 1.2 second buffer
            await new Promise(res => setTimeout(res, 1200));

        } catch {}
    });

    return commandQueue;
};

// Track previous teams
const previousTeams = new Map();

const teamMessages = {
    "Sheriff": [
        "You have joined the Whitelisted Team. Please remember to check warrants, enforce laws, and make arrests. Please ensure that you are familiar with the laws in regulations channel before playing.",
        "You have joined the Whitelisted Team. Before getting on shift, it is reminded you ensure you have ran your on-duty command and are prepared to handle today."
    ],

    "Police": [
        "You have joined the New York Police Department. Everything tool-wise is unWL, but be sure to use vehicles that have NYPD liveries. Undercover is WL reserved, so do not use it.",
        "You have joined the New York Police Department. A reminder that we do not moderate cuff rushing, meaning you can cuff people without having to say it in chat before doing so. Undercover and Swat are WL access only!"
    ],

    "DOT": [
        "You have joined NYC/NYS DOT. It is required to use cones and other props whenever blocking roads for towing vehicles. You may block off that lane if necessary. Lastly, most vehicles are unWL, but the liveries and companies are.",
        "You have joined NYC/NYS DOT. As regulated under NYCRP regulations and laws, please use cones and barriers during towing or construction on busy roads, streets, or public areas that might be affected."
    ]
};

async function checkTeams() {
    try {
        const res = await fetch(`${config.erlc.baseUrl}/v2/server?Players=true`, {
            headers: { "server-key": config.erlc.apiKey }
        });

        if (!res.ok) return;

        const data = await res.json();
        const players = data.Players || [];

        const currentPlayers = new Set();

        for (const p of players) {

            const username = p.Player.split(":")[0];
            const currentTeam = (p.Team || "").trim();

            currentPlayers.add(username);

            const oldTeam = previousTeams.get(username);

            // If first time seeing them, just store team (no message)
            if (!oldTeam) {
                previousTeams.set(username, currentTeam);
                continue;
            }

            // If team changed
            if (oldTeam !== currentTeam) {

                previousTeams.set(username, currentTeam);

                // Only send if they switched INTO one of our teams
                if (teamMessages[currentTeam]) {

                    const messages = teamMessages[currentTeam];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

                    setTimeout(async () => {
                        await sendCommand(`:pm ${username} ${randomMessage}`);
                    }, 2000);
                }
            }
        }

        // Remove players who left
        for (const savedUser of previousTeams.keys()) {
            if (!currentPlayers.has(savedUser)) {
                previousTeams.delete(savedUser);
            }
        }

    } catch {}
}

function startTeamNoticeSystem() {
    setInterval(checkTeams, 4000);
}

module.exports = { startTeamNoticeSystem };