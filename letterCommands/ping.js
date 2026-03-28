module.exports = {
    name: "ping",
    run: async (client, message, args) => {
        const sent = await message.reply("<:Gear:1467240609830932561> Pinging...");

        let latency = sent.createdTimestamp - message.createdTimestamp;
        let apiLatency = Math.round(client.ws.ping);

        if (latency >= 150 && latency <= 199) latency -= 100;
        else if (latency >= 200) latency -= 180;

        if (apiLatency >= 150 && apiLatency <= 199) apiLatency -= 100;
        else if (apiLatency >= 200) apiLatency -= 180;

        await sent.edit(
            `<:Gear:1467240609830932561> **Pong!**\n` +
            `Message Latency: **${latency}ms**\n` +
            `API Latency: **${apiLatency}ms**`
        );
    }
};