const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require("../Config");

const EVENT_FILE = path.join(__dirname, "../eventfunctionmode.json");

// Discord channel to send PM errors
const ERROR_CHANNEL_ID = "1479534429985701948";

// ✅ LOG CHANNEL
const LOG_CHANNEL_ID = "1479534429985701948";

let knownPlayers = new Set();
let pendingPMs = new Set();
let alreadyPMd = new Set();

let lastTimestamp = 0;
let fallbackTimer = null;

// Read if event mode is enabled
async function getEventMode() {
    try {
        const data = JSON.parse(fs.readFileSync(EVENT_FILE, "utf8"));
        return data.enabled === true;
    } catch {
        return false;
    }
}

// Send errors to Discord channel
async function sendErrorToChannel(message) {
    try {
        await fetch(`https://discord.com/api/v10/channels/${ERROR_CHANNEL_ID}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${config.discordBotToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: message })
        });
    } catch (err) {
        console.log("Failed sending error to Discord:", err.message);
    }
}

// ✅ Send logs to Discord instead of console.log
async function sendLog(message) {
    try {
        await fetch(`https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${config.discordBotToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: message })
        });
    } catch {}
}

// Send batch PM
async function sendBatchPM(force = false) {
    if (!force && pendingPMs.size < 7) return;
    if (pendingPMs.size === 0) return;

    const users = Array.from(pendingPMs).slice(0, force ? pendingPMs.size : 7);
    users.forEach(u => {
        pendingPMs.delete(u);
        alreadyPMd.add(u);
    });

    const usernames = users.join(",");
    let success = false;

    while (!success) {
        try {
            // 🔁 replaced console.log
            sendLog(`Sending batch PM to: ${usernames}`);

            const res = await fetch(`${config.erlc.baseUrl}/v1/server/command`, {
                method: "POST",
                headers: {
                    "server-key": config.erlc.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    command: `:pm ${usernames} At this time, an event is being hosted. You may experience announcements or roleplays. Call !mod for info.`
                })
            });

            if (res.status === 429) {
                const data = await res.json().catch(() => ({}));
                const wait = ((data.retry_after || 2) + 0.5) * 1000;
                await sendErrorToChannel(`Rate limited PM ${usernames}, waiting ${wait / 1000}s`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "Unknown error");
                await sendErrorToChannel(`Failed PM ${usernames}: ${res.status} ${text}`);
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            // 🔁 replaced console.log
            sendLog(`Batch PM sent to: ${usernames}`);
            success = true;

        } catch (err) {
            await sendErrorToChannel(`Exception PM ${usernames}: ${err.message}`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // Continue sending if more users exist
    if (pendingPMs.size >= 7) {
        sendBatchPM();
    }

    // Reset fallback timer if queue emptied
    if (pendingPMs.size === 0 && fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
    }
}

// Start fallback timer
function startFallbackTimer() {
    if (fallbackTimer) return;

    fallbackTimer = setTimeout(() => {
        if (pendingPMs.size > 0) {
            sendBatchPM(true);
        }
        fallbackTimer = null;
    }, 180000); // 3 minutes
}

// Check join logs
async function checkJoins() {
    const eventEnabled = await getEventMode();
    if (!eventEnabled) return;

    try {
        const res = await fetch(`${config.erlc.baseUrl}/v1/server/joinlogs`, {
            method: "GET",
            headers: {
                "server-key": config.erlc.apiKey,
                "Accept": "*/*"
            }
        });

        const data = await res.json();
        if (!Array.isArray(data)) return;

        for (const log of data) {
            if (!log.Join) continue;
            if (log.Timestamp <= lastTimestamp) continue;

            lastTimestamp = Math.max(lastTimestamp, log.Timestamp);

            const username = log.Player.split(":")[0];

            if (!knownPlayers.has(username) && !alreadyPMd.has(username)) {
                knownPlayers.add(username);
                pendingPMs.add(username);
            }
        }

        if (pendingPMs.size > 0) {
            startFallbackTimer();
        }

        if (pendingPMs.size >= 7) {
            sendBatchPM();
        }

    } catch (err) {
        await sendErrorToChannel(`Join check error: ${err.message}`);
    }
}

// Start system
async function startEventPMSystem() {
    // 🔁 replaced console.log
    sendLog("Event PM system started");
    setInterval(checkJoins, 30000);
}

module.exports = { startEventPMSystem };