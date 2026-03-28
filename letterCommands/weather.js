const weather = require("weather-js");

module.exports = {
    name: "weather",
    run: async (client, message, args) => {
        const location = "New York";

        weather.find({ search: location, degreeType: "F" }, async function (err, result) {
            if (err || !result || !result[0]) {
                return message.reply("<:Error:1467240551681360086> Could not fetch the weather.");
            }

            const data = result[0].current;

            message.reply(
                `🌤 **Weather in ${location}**\n` +
                `Temperature: **${data.temperature}°F**\n` +
                `Feels like: **${data.feelslike}°F**\n` +
                `Sky: **${data.skytext}**\n` +
                `Humidity: **${data.humidity}%**`
            );
        });
    }
};
