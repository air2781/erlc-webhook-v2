const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("../Config");

const WARRANT_LOG_PATH = path.join(__dirname, "../warrantlogs.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warrantinfo")
        .setDescription("Check warrant and in-game info")
        .addStringOption(option =>
            option.setName("username")
                .setDescription("Roblox username")
                .setRequired(true)
        ),

    run: async (interaction) => {

        await interaction.deferReply();
        const input = interaction.options.getString("username").trim();

        // ---------------- Fetch ERLC v2 ----------------
        const fetchV2Data = async () => {
            try {
                const res = await fetch(
                    `${config.erlc.baseUrl}/v2/server?Players=true&Vehicles=true`,
                    {
                        headers: { "server-key": config.erlc.apiKey }
                    }
                );

                if (!res.ok) return { Players: [], Vehicles: [] };

                const data = await res.json();
                return {
                    Players: data.Players || [],
                    Vehicles: data.Vehicles || []
                };

            } catch {
                return { Players: [], Vehicles: [] };
            }
        };

        try {

            // ---------------- Load Warrants ----------------
            let warrants = [];
            if (fs.existsSync(WARRANT_LOG_PATH)) {
                warrants = JSON.parse(
                    fs.readFileSync(WARRANT_LOG_PATH, "utf-8")
                );
            }

            const matchingWarrants = warrants.filter(
                w => w.username.toLowerCase() === input.toLowerCase()
            );

            const approvedWarrant = matchingWarrants.find(
                w => w.status === "Approved"
            );

            // ---------------- Roblox Info ----------------
            let robloxDisplay = "Unknown";
            let avatarUrl = null;
            let userId = null;

            try {
                const userRes = await fetch(
                    "https://users.roblox.com/v1/usernames/users",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ usernames: [input] })
                    }
                );

                const userData = await userRes.json();

                if (userData.data && userData.data.length) {
                    userId = userData.data[0].id;
                    robloxDisplay = userData.data[0].displayName;

                    const thumbRes = await fetch(
                        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
                    );

                    const thumbData = await thumbRes.json();
                    avatarUrl = thumbData.data[0]?.imageUrl;
                }

            } catch {}

            // ---------------- Server Info ----------------
            const { Players, Vehicles } = await fetchV2Data();

            let vehicleInfo = "No Vehicle Spawned";
            let teamInfo = "Not In-Game";

            const targetPlayer = Players.find(p =>
                p.Player.split(":")[0].toLowerCase() === input.toLowerCase()
            );

            if (targetPlayer) {
                const username = targetPlayer.Player.split(":")[0];

                const userVehicle = Vehicles.find(
                    v => v.Owner === username
                );

                if (userVehicle) {
                    vehicleInfo =
                        `${userVehicle.Name} | ` +
                        `${userVehicle.ColorName || "N/A"} | ` +
                        `${userVehicle.Texture || "N/A"}`;
                }

                teamInfo = targetPlayer.Team || "Unknown";
            }

            // ---------------- Warrant Status ----------------
            let warrantStatus = "No Active Warrants";

            if (approvedWarrant) {
                warrantStatus =
                    `🚨 **Warrant Out For Arrest**\n` +
                    `Issued by agency ${approvedWarrant.department}\n` +
                    `Danger Level: ${approvedWarrant.dangerLevel}`;
            }

            // ---------------- Embed ----------------
            const embed = new EmbedBuilder()
                .setTitle(`Warrant Info: ${input}`)
                .addFields(
                    { name: "Username", value: input, inline: true },
                    { name: "Display Name", value: robloxDisplay, inline: true },
                    { name: "Vehicle Information", value: vehicleInfo },
                    { name: "Team Information", value: teamInfo, inline: true },
                    { name: "Warrant Status", value: warrantStatus }
                )
                .setColor("Yellow")
                .setTimestamp();

            if (avatarUrl) embed.setThumbnail(avatarUrl);

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            interaction.editReply("<:ErrorX:1473547704444653568> Failed to fetch warrant info.");
        }
    }
};