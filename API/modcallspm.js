const fetch = require("node-fetch");
const config = require("../Config");

const STAFF_ROLE_ID = "1319403388495990824";
const handledCalls = new Set();

let commandQueue = Promise.resolve();
let lastCommandTime = 0;

/* -----------------------------
   Fast Command Sender (Queued)
----------------------------- */
const sendCommand = (cmd) => {
    commandQueue = commandQueue.then(async () => {
        try {
            let sent = false;

            while (!sent) {

                const now = Date.now();
                const diff = now - lastCommandTime;

                if (diff < 5000) {
                    await new Promise(r => setTimeout(r, 5000 - diff));
                }

                const res = await fetch(`${config.erlc.baseUrl}/v1/server/command`, {
                    method: "POST",
                    headers: {
                        "server-key": config.erlc.apiKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ command: cmd })
                });

                if (res.ok) {
                    lastCommandTime = Date.now();
                    sent = true;
                    continue;
                }

                if (res.status === 429) {
                    const data = await res.json().catch(() => ({}));
                    const retry = (data.retry_after ? data.retry_after * 1000 : 5000);
                    await new Promise(r => setTimeout(r, retry));
                    continue;
                }

                await new Promise(r => setTimeout(r, 1500));
            }

        } catch {
            await new Promise(r => setTimeout(r, 1500));
        }
    });

    return commandQueue;
};

/* -----------------------------
   Fetch With Timeout (2s max)
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
   Staff Count
----------------------------- */
function getStaffCount(client) {
    const guild = client.guilds.cache.first();
    if (!guild) return 0;

    const role = guild.roles.cache.get(STAFF_ROLE_ID);
    if (!role) return 0;

    return role.members.size;
}

/* -----------------------------
   Message Builder
----------------------------- */
function buildMessage(count) {

    if (count === 0) {
        return `You have called a staff by doing !help or !mod. You can cancel this anytime by typing "!cancelmod". Once the moderator teleports to you, if you cannot see their chats, sit down to tell them.`;
    }

    if (count <= 2) {
        return `You have called a staff by doing !help or !mod. You can cancel this anytime by typing "!cancelmod". Once the moderator teleports to you, if you cannot see their chats, sit down to tell them.`;
    }

    return `You have called a staff by doing !help or !mod. You can cancel this anytime by typing "!cancelmod". Once the moderator teleports to you, if you cannot see their chats, sit down to tell them.`;
}

/* -----------------------------
   Check ModCalls (v2)
----------------------------- */
async function checkModCalls(client) {

    try {

        const res = await fetchWithTimeout(
            `${config.erlc.baseUrl}/v2/server?ModCalls=true`,
            {
                headers: {
                    "server-key": config.erlc.apiKey
                }
            }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (!data.ModCalls || data.ModCalls.length === 0) return;

        for (const call of data.ModCalls) {

            if (!call.Caller || !call.Timestamp) continue;

            const id = `${call.Caller}-${call.Timestamp}`;

            if (handledCalls.has(id)) continue;

            handledCalls.add(id);

            const username = call.Caller.split(":")[0];
            const staffCount = getStaffCount(client);
            const message = buildMessage(staffCount);

            sendCommand(`:pm ${username} ${message}`);
        }

    } catch {
        // silently ignore timeout / api errors
    }
}

/* -----------------------------
   Smart Async Loop
----------------------------- */
function start(client) {

    async function loop() {

        await checkModCalls(client);

        // runs 750ms AFTER previous check completes
        setTimeout(loop, 750);
    }

    loop();
}

module.exports = { start };