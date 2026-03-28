const fetch = require("node-fetch");
const config = require("../Config");

const CHANNEL_ID = "1290085308469346320";

const ROLE_1 = "1319403388495990824";
const ROLE_2 = "1290085306619396181";

/* -----------------------------
   VIP Roblox Usernames
----------------------------- */
const VIP_USERS = [
    "OfficialAmazePlays",
    "McSloth_YT",
    "OMBcreates",
    "RufflesPlaysMC",
    "NotSethyboyYT",
    "XxKemodriverxX",
    "OfficerJohn43YT",
    "Aviator_Phil",
    "GameNGo_YT"
];

const detectedUsers = new Set();

/* -----------------------------
   Fetch With Timeout
----------------------------- */
const fetchWithTimeout = async (url, options, timeout = 2000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeout)
        )
    ]);
};

/* -----------------------------
   Check Players (v2)
----------------------------- */
async function checkPlayers(client) {

    try {

        const res = await fetchWithTimeout(
            `${config.erlc.baseUrl}/v2/server?Players=true`,
            {
                headers: {
                    "server-key": config.erlc.apiKey
                }
            }
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!data.Players) return;

        for (const player of data.Players) {

            if (!player.Player) continue;

            const username = player.Player.split(":")[0];

            if (!VIP_USERS.includes(username)) continue;

            if (detectedUsers.has(username)) continue;

            detectedUsers.add(username);

            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) return;

            await channel.send({
                content: `<@&${ROLE_1}>, <@&${ROLE_2}> a notable VIP **${username}** has joined the session. Staff are requested to refrain from acting extreme, and to be on their best behaviour. Directives have been notified. Keep watch during this time.`,
                allowedMentions: {
                    roles: [ROLE_1, ROLE_2]
                }
            });
        }

    } catch {}
}

/* -----------------------------
   Smart Loop
----------------------------- */
function start(client) {

    async function loop() {

        await checkPlayers(client);

        setTimeout(loop, 5000); // checks every 5 seconds
    }

    loop();
}

module.exports = { start };