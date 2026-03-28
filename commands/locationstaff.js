const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const config = require("../Config");

const postalMaps = {
    "1201": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "1202": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "1203": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "1205": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "1207": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "1404": "https://media.discordapp.net/attachments/1222021798158143518/1475278478395048017/image.png",
    "202": "https://media.discordapp.net/attachments/1222021798158143518/1475278794293117049/image.png",
    "213": "https://media.discordapp.net/attachments/1334740979269374014/1475279581693874277/image.png",
    "212": "https://media.discordapp.net/attachments/1334740979269374014/1475279581693874277/image.png",
    "207": "https://media.discordapp.net/attachments/1334740979269374014/1475279581693874277/image.png",
    "208": "https://media.discordapp.net/attachments/1334740979269374014/1475279581693874277/image.png",
    "211": "https://media.discordapp.net/attachments/1334740979269374014/1475279581693874277/image.png",
    "406": "https://media.discordapp.net/attachments/1334740979269374014/1475279783653933248/image.png",
    "402": "https://media.discordapp.net/attachments/1334740979269374014/1475279783653933248/image.png",
    "403": "https://media.discordapp.net/attachments/1334740979269374014/1475280006187061418/image.png",
    "404": "https://media.discordapp.net/attachments/1334740979269374014/1475280006187061418/image.png",
    "216": "https://media.discordapp.net/attachments/1334740979269374014/1475280006187061418/image.png",
    "217": "https://media.discordapp.net/attachments/1334740979269374014/1475280006187061418/image.png",
    "801": "https://media.discordapp.net/attachments/1334740979269374014/1475284788171505825/image.png",
    "802": "https://media.discordapp.net/attachments/1334740979269374014/1475284788171505825/image.png",
    "910": "https://media.discordapp.net/attachments/1454715136941232139/1475315014704435385/image.png",
    "908": "https://media.discordapp.net/attachments/1454715136941232139/1475315014704435385/image.png",
    "906": "https://media.discordapp.net/attachments/1454715136941232139/1475315014704435385/image.png",
    "605": "https://media.discordapp.net/attachments/1454715136941232139/1475315014704435385/image.png",
    "303": "https://media.discordapp.net/attachments/1454715136941232139/1475363972814475334/image.png",
    "304": "https://media.discordapp.net/attachments/1454715136941232139/1475363972814475334/image.png",
    "306": "https://media.discordapp.net/attachments/1454715136941232139/1475353210746310746/image.png",
    "307": "https://media.discordapp.net/attachments/1454715136941232139/1475353210746310746/image.png",
    "305": "https://media.discordapp.net/attachments/1454715136941232139/1475353210746310746/image.png",
    "309": "https://media.discordapp.net/attachments/1454715136941232139/1475353210746310746/image.png",
    "302": "https://media.discordapp.net/attachments/1454715136941232139/1475364656280240299/image.png",
    "311": "https://media.discordapp.net/attachments/1454715136941232139/1475364656280240299/image.png",
    "510": "https://media.discordapp.net/attachments/1454715136941232139/1475365358008533143/image.png"
    
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("location")
        .setDescription("Check a player's in-game location and vehicle status")
        .addStringOption(option =>
            option.setName("input")
                .setDescription("Roblox username or UserID (partial match supported)")
                .setRequired(true)
        ),

    run: async (interaction) => {
        await interaction.deferReply();
        const input = interaction.options.getString("input").trim();

        // ----- v2 Fetch Players & Vehicles -----
        const fetchV2Data = async () => {
            try {
                const res = await fetch(`${config.erlc.baseUrl}/v2/server?Players=true&Vehicles=true`, {
                    headers: { "server-key": config.erlc.apiKey }
                });
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
            let { Players: players, Vehicles: vehicles } = await fetchV2Data();

            if (!players.length) return interaction.editReply("❌ Could not fetch player data.");

            // ----- Find Target Player -----
            let targetPlayer = players.find(p => p.Player.split(":")[1] === input);
            if (!targetPlayer) {
                const lowerInput = input.toLowerCase();
                targetPlayer = players.find(p => p.Player.split(":")[0].toLowerCase().includes(lowerInput));
            }
            if (!targetPlayer) return interaction.editReply("❌ Player not currently in-game.");

            const loc = targetPlayer.Location || {};
            let postalImage = postalMaps[loc.PostalCode] || null;

            // ----- Vehicle Info -----
            const username = targetPlayer.Player.split(":")[0];
            const userVehicle = vehicles.find(v => v.Owner === username);
            let vehicleInfo = "No Vehicle Spawned";
            if (userVehicle) {
                vehicleInfo = `${userVehicle.Name} | ${userVehicle.ColorName || "N/A"} | ${userVehicle.Texture || "N/A"}`;
            }

            // ----- Team Info -----
            const teamName = targetPlayer.Team || "Unknown";

            // ----- Embed Setup -----
            const embed = new EmbedBuilder()
                .setTitle(`📍 Location of ${username}`)
                .addFields(
                    { name: "X", value: loc.LocationX?.toString() || "Unknown", inline: true },
                    { name: "Z", value: loc.LocationZ?.toString() || "Unknown", inline: true },
                    { name: "Postal Code", value: loc.PostalCode || "Unknown", inline: true },
                    { name: "Street Name", value: loc.StreetName || "Unknown", inline: true },
                    { name: "Building Number", value: loc.BuildingNumber || "Unknown", inline: true },
                    { name: "Vehicle Information", value: vehicleInfo, inline: true },
                    { name: "Team", value: teamName, inline: true },
                    { name: "Live / Predicted Location", value: "N/A", inline: true }
                )
                .setColor(0x1f8b4c)
                .setTimestamp();

            if (postalImage) embed.setImage(postalImage);

            const replyMsg = await interaction.editReply({ embeds: [embed] });

            // ----- Start Live Updates -----
            let lastLoc = { x: loc.LocationX, z: loc.LocationZ, postal: loc.PostalCode };
            const startTime = Date.now();

            const interval = setInterval(async () => {
                if (Date.now() - startTime > 180000) { // 3 minutes
                    clearInterval(interval);
                    return replyMsg.delete().catch(() => {});
                }

                const { Players: updatedPlayers, Vehicles: updatedVehicles } = await fetchV2Data();
                const updatedPlayer = updatedPlayers.find(p => p.Player.split(":")[1] === targetPlayer.Player.split(":")[1]);
                if (!updatedPlayer) {
                    clearInterval(interval);
                    embed.setTitle(`❌ ${username} has left the game`);
                    return replyMsg.edit({ embeds: [embed] }).catch(() => {});
                }

                const updatedLoc = updatedPlayer.Location || {};
                const dx = (updatedLoc.LocationX || 0) - (lastLoc.x || 0);
                const dz = (updatedLoc.LocationZ || 0) - (lastLoc.z || 0);
                lastLoc.x = updatedLoc.LocationX;
                lastLoc.z = updatedLoc.LocationZ;

                let direction = "Stationary";
                if (Math.abs(dx) > Math.abs(dz)) direction = dx > 0 ? "East" : "West";
                else if (Math.abs(dz) > Math.abs(dx)) direction = dz > 0 ? "South" : "North";

                // Update postal image if changed
                if (updatedLoc.PostalCode && updatedLoc.PostalCode !== lastLoc.postal) {
                    lastLoc.postal = updatedLoc.PostalCode;
                    postalImage = postalMaps[updatedLoc.PostalCode] || null;
                    embed.setImage(postalImage);
                }

                // Update vehicle info
                const currentVehicle = updatedVehicles.find(v => v.Owner === username);
                vehicleInfo = currentVehicle
                    ? `${currentVehicle.Name} | ${currentVehicle.ColorName || "N/A"} | ${currentVehicle.Texture || "N/A"}`
                    : "No Vehicle Spawned";

                // Update team info
                const updatedTeam = updatedPlayer.Team || "Unknown";

                // Update embed fields
                embed.data.fields[0].value = updatedLoc.LocationX?.toString() || "Unknown";
                embed.data.fields[1].value = updatedLoc.LocationZ?.toString() || "Unknown";
                embed.data.fields[2].value = updatedLoc.PostalCode || "Unknown";
                embed.data.fields[3].value = updatedLoc.StreetName || "Unknown";
                embed.data.fields[4].value = updatedLoc.BuildingNumber || "Unknown";
                embed.data.fields[5].value = vehicleInfo;
                embed.data.fields[6].value = updatedTeam;
                embed.data.fields[7].value = `Predicted Location: Heading ${direction}`;

                await replyMsg.edit({ embeds: [embed] });

            }, 4500); // every 2 seconds

        } catch (err) {
            interaction.editReply("❌ Something went wrong while fetching location.");
        }
    }
};