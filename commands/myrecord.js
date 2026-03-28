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
        .setName("myrecord")
        .setDescription("View your criminal record"),

    run: async (interaction) => {

        await interaction.deferReply({ ephemeral: true });

        try {

            // ---------------- BLOXLINK VERIFICATION ----------------
            let robloxId;
            let robloxUsername;

            try {

                const bloxlinkRes = await fetch(
                    `https://api.blox.link/v4/public/guilds/${config.guildId}/discord-to-roblox/${interaction.user.id}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${config.bloxlink.apiKey}`
                        }
                    }
                );

                if (!bloxlinkRes.ok) {
                    return interaction.editReply("❌ You are not verified with Bloxlink.");
                }

                const bloxlinkData = await bloxlinkRes.json();

                if (!bloxlinkData || !bloxlinkData.robloxID) {
                    return interaction.editReply("❌ You are not verified with Bloxlink.");
                }

                robloxId = bloxlinkData.robloxID;
                robloxUsername = bloxlinkData.robloxUsername;

            } catch (err) {
                console.error("[BLOXLINK ERROR]", err);
                return interaction.editReply("❌ Failed to verify with Bloxlink.");
            }

            // ---------------- ROBLOX ACCOUNT INFO ----------------
            const robloxRes = await fetch(
                `https://users.roblox.com/v1/users/${robloxId}`
            );

            const robloxData = await robloxRes.json();

            const displayName = robloxData?.displayName || "Unknown";
            const createdAt = robloxData?.created
                ? new Date(robloxData.created).toDateString()
                : "Unknown";

            // Avatar
            let avatarUrl = null;
            try {
                const thumbRes = await fetch(
                    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`
                );
                const thumbData = await thumbRes.json();
                avatarUrl = thumbData?.data?.[0]?.imageUrl || null;
            } catch {}

            // ---------------- LOAD WARRANTS SAFELY ----------------
            let warrants = [];

            if (fs.existsSync(WARRANT_LOG_PATH)) {
                try {
                    warrants = JSON.parse(
                        fs.readFileSync(WARRANT_LOG_PATH, "utf-8")
                    );
                } catch {
                    warrants = [];
                }
            }

            const approvedWarrants = warrants.filter(w =>
                w &&
                typeof w === "object" &&
                typeof w.username === "string" &&
                typeof w.status === "string" &&
                w.status === "Approved" &&
                w.username.toLowerCase() === robloxUsername.toLowerCase()
            );

            const warrantCount = approvedWarrants.length;

            // ---------------- FETCH ERLC VEHICLE INFO ----------------
            let vehicleInfo = "No Vehicle Spawned";

            try {

                const res = await fetch(
                    `${config.erlc.baseUrl}/v2/server?Players=true&Vehicles=true`,
                    {
                        headers: { "server-key": config.erlc.apiKey }
                    }
                );

                if (res.ok) {

                    const data = await res.json();

                    const player = data.Players?.find(p =>
                        typeof p.Player === "string" &&
                        p.Player.split(":")[0].toLowerCase() === robloxUsername.toLowerCase()
                    );

                    if (player) {

                        const vehicle = data.Vehicles?.find(v =>
                            typeof v.Owner === "string" &&
                            v.Owner.toLowerCase() === robloxUsername.toLowerCase()
                        );

                        if (vehicle) {
                            vehicleInfo =
                                `${vehicle.Name || "Unknown"} | ` +
                                `${vehicle.ColorName || "N/A"} | ` +
                                `${vehicle.Texture || "N/A"}`;
                        }
                    }
                }

            } catch {}

            // ---------------- TITLE LOGIC ----------------
            const title =
                robloxUsername.length > 25
                    ? "Your Record"
                    : robloxUsername;

            // ---------------- EMBED ----------------
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor("Yellow")
                .addFields(
                    {
                        name: "Warrants",
                        value: `${warrantCount}`,
                        inline: true
                    },
                    {
                        name: "Display Name",
                        value: displayName,
                        inline: true
                    },
                    {
                        name: "Account Created",
                        value: createdAt,
                        inline: true
                    },
                    {
                        name: "Vehicle Information",
                        value: vehicleInfo
                    }
                )
                .setTimestamp();

            if (avatarUrl) embed.setThumbnail(avatarUrl);

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error("[MYRECORD ERROR]", err);
            await interaction.editReply("❌ Failed to fetch your record.");
        }
    }
};