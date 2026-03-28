const weather = require("weather-js");
const fetch = require("node-fetch");
const config = require("../Config");
const fs = require("fs");
const path = require("path");

const EVENT_FILE = path.join(__dirname, "../eventfunctionmode.json");

let eventMode = false;

setInterval(() => {
    try {
        const data = JSON.parse(fs.readFileSync(EVENT_FILE, "utf8"));
        eventMode = data.enabled === true;
    } catch {}
}, 10000);


// COMMAND QUEUE
let commandQueue = Promise.resolve();

// ✅ DISCORD LOG CHANNEL
const LOG_CHANNEL_ID = "1479534429985701948";

async function sendLog(client, message) {
    try {
        const channel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (channel) channel.send(message);
    } catch {}
}

async function sendCommand(cmd, client) {

    commandQueue = commandQueue.then(async () => {

        let sent = false;

        while (!sent) {

            try {

                const res = await fetch(`${config.erlc.baseUrl}/v1/server/command`, {
                    method: "POST",
                    headers: {
                        "server-key": config.erlc.apiKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ command: cmd })
                });

                // SUCCESS
                if (res.ok) {

                    // 🔁 send to Discord instead of console.log
                    if (client) sendLog(client, `Command sent: ${cmd}`);

                    sent = true;

                    // DYNAMIC DELAY (FASTER IF POSSIBLE)
                    const remaining = Number(res.headers.get("x-ratelimit-remaining"));
                    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;

                    if (remaining <= 1 && reset) {
                        const wait = Math.max(reset - Date.now(), 0);
                        await new Promise(r => setTimeout(r, wait));
                    } else {
                        await new Promise(r => setTimeout(r, 1000)); // faster than before
                    }

                    continue;
                }

                // HANDLE 429 PROPERLY
                if (res.status === 429) {
                    const data = await res.json().catch(() => ({}));
                    const retry = (data.retry_after ? data.retry_after * 1000 : 5000);

                    await new Promise(r => setTimeout(r, retry));
                    continue;
                }

                // OTHER FAIL → small retry
                await new Promise(res => setTimeout(res, 2000));

            } catch {

                await new Promise(res => setTimeout(res, 2000));

            }

        }

    });

    return commandQueue;
}


// WEATHER CONVERSION
function convertWeather(skytext) {

    skytext = skytext.toLowerCase();

    if (skytext.includes("thunder")) return "thunderstorm";

    if (
        skytext.includes("rain") ||
        skytext.includes("drizzle") ||
        skytext.includes("shower")
    ) return "rain";

    if (
        skytext.includes("snow") ||
        skytext.includes("sleet") ||
        skytext.includes("blizzard")
    ) return "snow";

    if (
        skytext.includes("fog") ||
        skytext.includes("haze") ||
        skytext.includes("mist")
    ) return "fog";

    return "clear";
}


// TRACK LAST VALUES
let lastWeather = "";


// REAL NYC TIME FORMAT (FIXED)
function getNYCTimeFormatted() {

    const options = {
        timeZone: "America/New_York",
        hour12: false,
        hour: "numeric",
        minute: "numeric"
    };

    const formatter = new Intl.DateTimeFormat([], options);
    const parts = formatter.formatToParts(new Date());

    let hour = parseInt(parts.find(p => p.type === "hour").value, 10);
    let minute = parseInt(parts.find(p => p.type === "minute").value, 10);

    if (hour === 24) hour = 0;

    if (minute === 0) return `${hour}`;

    return `${hour}.${minute.toString().padStart(2, "0")}`;
}


// MAIN SYNC
async function syncWeatherTime(client) {

    if (eventMode) return;

    weather.find({ search: "New York, NY", degreeType: "F" }, async function (err, result) {

        if (err || !result || !result[0]) return;

        const data = result[0].current;
        const sky = data.skytext;

        const timeFormatted = getNYCTimeFormatted();
        const weatherCmd = convertWeather(sky);


        // SEND TIME EVERY 3 MINUTES (CORRECT FORMAT)
        await sendCommand(`:time ${timeFormatted}`, client);


        if (weatherCmd !== lastWeather) {

            await sendCommand(`:weather ${weatherCmd}`, client);
            lastWeather = weatherCmd;

        }

    });
}


function startWeatherTimeSystem(client) {

    syncWeatherTime(client);

    setInterval(() => syncWeatherTime(client), 180000); // 3 minutes
}

module.exports = { startWeatherTimeSystem };