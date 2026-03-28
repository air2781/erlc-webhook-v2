const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Role IDs allowed
const allowedRoles = [
    "1410821162564452383",
    "1290085306619396181",
    "1460517136241004574"
];

// Paths to JSON files
const eventModePath = path.join(__dirname, "./eventfunctionmode.json");
const eventTypePath = path.join(__dirname, "./eventtype.json");
const tdmPath = path.join(__dirname, "./tdmconfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventmodepanel")
        .setDescription("Admin panel for events"),
    
    run: async (interaction, client) => {
        try {
            if (
                !interaction.member.permissions.has("Administrator") &&
                !interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))
            ) {
                return interaction.reply({ content: "❌ You do not have permission to run this command.", ephemeral: false });
            }

            let eventStatusJSON = { active: false };
            if (fs.existsSync(eventModePath)) {
                eventStatusJSON = JSON.parse(fs.readFileSync(eventModePath, "utf8"));
            }

            const eventStatusText = eventStatusJSON.active ? "**Event Active**" : "**No Event Active**";

            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("Event Panel")
                .setDescription(`> Event Status: ${eventStatusText}\n> Choose a type of event principal. Contact @air2781 on how to use.`);

            const menu = new StringSelectMenuBuilder()
                .setCustomId("eventModeSelect")
                .setPlaceholder("Select an Event Type")
                .addOptions([
                    { label: "Team Deathmatch (TDM)", description: "Like Counter-Strike but only deathmatches with no goals", value: "TDM" },
                    { label: "War", description: "Still under construction", value: "War" },
                    { label: "Racing (ATVs/Cars)", description: "Still under construction", value: "Racing" },
                    { label: "Zombie (Infection)", description: "Still under construction", value: "Zombie" },
                    { label: "Purge (FFA)", description: "Still under construction", value: "Purge" },
                    { label: "Battle Royale", description: "Still under construction", value: "BattleRoyale" },
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });

            const collector = interaction.channel.createMessageComponentCollector({
                componentType: 3,
                time: 60000,
                filter: i => i.user.id === interaction.user.id
            });

            collector.on("collect", async i => {

                const selected = i.values[0];

                const eventTypeData = {
                    type: selected,
                    status: eventStatusJSON.active ? "Event Mode Active" : "Event Mode Not Active"
                };

                fs.writeFileSync(eventTypePath, JSON.stringify(eventTypeData, null, 4));

                if (selected === "TDM") {

                    const tdmEmbed = new EmbedBuilder()
                        .setColor("Yellow")
                        .setTitle("Team Deathmatch")
                        .setDescription(
`> To toggle, adjust, remove, or add anything of the below options, reply to the embled to do so. The embled buttons will only reply for 3 minutes. Afterwards, you must run the command again.

> **Enable** - Enables the plugin. Must be toggled for any of the below functions to work.
> **Disable** - Disables and resets all plugins. Perfect for reseting the plugin.
> **[i] Teams** - Allows you to add up to 14 teams. (Ex: "3 teams")
> **[i]username** - Adds the user or multiple to that team depending on the one you choose. Once done listing the users, don't add any comma at the end. (Ex: "1amit_xpro,Usmaniscool1008")
> **remove username** - Removes the user or multiple from all teams added in. (Ex: "remove amit_xpro,0uci,soop03")
> **Timer [i]s/m** - Activates a timer for the duration of the round. (Ex: "timer 30s" or "timer 5m")
> **Disable Timer** - Disables the timer.
> **Endmatch** - Ends the match and stops all configurations forcefully.
> **Startmatch** - Starts the match and starts all configurations.
> **tp username** - Teleport all dead or failed users on a team to a staff for spectating or count. (Ex: "tp lmnot")`
                        );

                    await i.update({ embeds: [tdmEmbed], components: [] });

                    if (!fs.existsSync(tdmPath)) {
                        fs.writeFileSync(tdmPath, JSON.stringify({
                            pluginactive:false,
                            teams:0,
                            teamassignments:{},
                            timer:null,
                            tp:null,
                            matchactive:false
                        }, null, 4));
                    }

                    const msgCollector = interaction.channel.createMessageCollector({
                        time: 180000,
                        filter: m => m.author.id === interaction.user.id
                    });

                    msgCollector.on("collect", async m => {

                        let config = JSON.parse(fs.readFileSync(tdmPath,"utf8"));
                        const content = m.content.toLowerCase().trim();

                        if(content === "enable"){
                            if(config.pluginactive){
                                return m.reply("❌ **Enable** is already active.");
                            }
                            config.pluginactive = true;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));
                            return m.reply("✅ **Enable** activated.");
                        }

                        if(content === "disable"){
                            config = { pluginactive:false, teams:0, teamassignments:{}, timer:null, tp:null, matchactive:false };
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));
                            return m.reply("✅ **Disable** activated and configuration reset.");
                        }

                        if(content.endsWith(" teams")){
                            const num = parseInt(content.split(" ")[0]);

                            if(!num || num < 1 || num > 14){
                                return m.reply("Team amount must be between **1 and 14**.");
                            }

                            if(config.teams === num){
                                return m.reply("That **team amount** is already active.");
                            }

                            config.teams = num;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply(` **${num} Teams** activated.`);
                        }

                        if(content.startsWith("timer ")){

                            const val = content.split(" ")[1];

                            if(!val || !/^\d+(s|m)$/.test(val)){
                                return m.reply("❌ Use format **timer 30s** or **timer 5m**.");
                            }

                            if(config.timer === val){
                                return m.reply("❌ That **Timer** is already active.");
                            }

                            config.timer = val;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply(`✅ **Timer ${val}** activated.`);
                        }

                        if(content === "disable timer"){
                            if(!config.timer){
                                return m.reply("❌ No timer is currently active.");
                            }

                            config.timer = null;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply("✅ **Timer disabled.**");
                        }

                        if(content.startsWith("tp ")){

                            const user = content.replace("tp ","").trim();

                            if(config.tp === user){
                                return m.reply("❌ That **TP user** is already set.");
                            }

                            config.tp = user;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply(`✅ **TP set to ${user}.**`);
                        }

                        if(content === "startmatch"){

                            if(config.matchactive){
                                return m.reply("❌ A match is already active.");
                            }

                            if(!config.pluginactive){
                                return m.reply("❌ Plugin must be **enabled** first.");
                            }

                            config.matchactive = true;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply("✅ **Match started.**");
                        }

                        if(content === "endmatch"){

                            if(!config.matchactive){
                                return m.reply("❌ No match is currently active.");
                            }

                            config.matchactive = false;
                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply("✅ **Match ended.**");
                        }

                        // REMOVE USERS FROM ALL TEAMS
                        if(content.startsWith("remove ")){

                            const users = content.replace("remove ","").split(",");

                            users.forEach(u=>{
                                const name = u.trim();
                                if(!name) return;

                                for(const team in config.teamassignments){
                                    config.teamassignments[team] = config.teamassignments[team].filter(p => p !== name);
                                }
                            });

                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply("✅ User(s) removed from all teams.");
                        }

                        if(/^\d/.test(content)){

                            const teamNumber = parseInt(content[0]);

                            if(teamNumber > config.teams){
                                return m.reply(`❌ Only **${config.teams}** team(s) exist.`);
                            }

                            const players = content.slice(1).split(",");

                            if(!config.teamassignments[teamNumber]){
                                config.teamassignments[teamNumber] = [];
                            }

                            players.forEach(p=>{
                                const name = p.trim();
                                if(!name) return;

                                const index = config.teamassignments[teamNumber].indexOf(name);

                                if(index !== -1){
                                    config.teamassignments[teamNumber].splice(index,1);
                                } else {
                                    config.teamassignments[teamNumber].push(name);
                                }
                            });

                            fs.writeFileSync(tdmPath,JSON.stringify(config,null,4));

                            return m.reply("✅ **Team assignment updated.**");
                        }

                    });

                } else {

                    await i.update({
                        content:`✅ Event Type set to **${selected}**.\nStatus: ${eventTypeData.status}`,
                        embeds:[],
                        components:[]
                    });

                }

                collector.stop();

            });

        } catch(err){

            console.error("EventModePanel error:",err);

            if(!interaction.replied){
                await interaction.reply({content:"❌ An error occurred.",ephemeral:false});
            }

        }
    }
};
