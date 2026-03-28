const { SlashCommandBuilder } = require("discord.js");
const weather = require("weather-js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Get New York’s real-time weather"),

    run: async (interaction) => {
        // Defer reply safely (ephemeral works correctly in v14)
        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await new Promise((resolve, reject) => {
                weather.find(
                    { search: "New York, NY", degreeType: "F" },
                    (err, res) => {
                        if (err) return reject(err);
                        if (!res || !res[0]) return reject("No weather data found.");
                        resolve(res);
                    }
                );
            });

            const loc = result[0].location;
            const now = result[0].current;

            await interaction.editReply(
                `🌤️ **Weather for ${loc.name}**\n` +
                `🌡️ Temperature: **${now.temperature}°F**\n` +
                `😮 Feels Like: **${now.feelslike}°F**\n` +
                `🌥 Sky: **${now.skytext}**\n` +
                `💧 Humidity: **${now.humidity}%**`
            );

        } catch (err) {
            console.error("Weather command error:", err);

            await interaction.editReply(
                "❌ Sorry — couldn't fetch weather data."
            );
        }
    },
};
