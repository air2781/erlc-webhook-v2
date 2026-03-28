const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const config = require("../Config");
const { EmbedBuilder } = require("discord.js");

const FILE = path.join(__dirname, "../hmessage.json");
const EVENT_FILE = path.join(__dirname, "../eventfunctionmode.json");

let eventMode = false;

// check event mode every 10 seconds
setInterval(() => {
    try {
        const data = JSON.parse(fs.readFileSync(EVENT_FILE, "utf8"));
        eventMode = data.enabled === true;
    } catch (err) {
        console.error("Event mode read error:", err);
    }
}, 10000);

module.exports = (client) => {

    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

    if (!data.messages) return;

    data.messages.forEach((msg, index) => {

        if (!msg.content || !msg.interval) return;

        console.log(`Loaded auto H message ${index + 1}`);

        setInterval(async () => {

            // STOP if event mode enabled
            if (eventMode) return;

            try {

                const response = await fetch("https://api.policeroleplay.community/v1/server/command", {
                    method: "POST",
                    headers: {
                        "server-key": config.erlc.apiKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        command: `:h ${msg.content}`
                    })
                });

                const result = await response.json();

                const logChannel = client.channels.cache.get("1479534429985701948");

                if (logChannel) {

                    const embed = new EmbedBuilder()
                        .setTitle("Auto Hint Sent")
                        .setColor("Yellow")
                        .addFields(
                            { name: "Message", value: msg.content },
                            { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                        );

                    logChannel.send({ embeds: [embed] });

                }

            } catch (err) {
                console.error("Failed sending H message:", err);
            }

        }, msg.interval);

    });

};