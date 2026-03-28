const { SlashCommandBuilder } = require("discord.js");

function generateCaseID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 10; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamereport")
        .setDescription("Report a Roblox user for violations.")
        .addStringOption(o =>
            o.setName("roblox_user").setDescription("Full Roblox username").setRequired(true))
        .addStringOption(o =>
            o.setName("reason").setDescription("Rule violations").setRequired(true))
        .addAttachmentOption(o =>
            o.setName("evidence").setDescription("Evidence").setRequired(true))
        .addStringOption(o =>
            o.setName("notes").setDescription("Extra notes").setRequired(false)),

    run: async (interaction, client) => {
        await interaction.deferReply({ ephemeral: true });

        const reporter = interaction.user;
        const robloxUser = interaction.options.getString("roblox_user");
        const reason = interaction.options.getString("reason");
        const evidence = interaction.options.getAttachment("evidence");
        const notes = interaction.options.getString("notes") || "No notes submitted.";

        const REPORT_CHANNEL = "1424290893258817536";

        const channel = await client.channels.fetch(REPORT_CHANNEL);
        if (!channel) return interaction.editReply("❌ Report channel missing.");

        const caseID = generateCaseID();

        const timestamp = new Date().toLocaleString("en-CA", {
            timeZone: "America/Toronto",
            hour12: false
        });

        const msg =
`Reporter: ${reporter} (${reporter.id})
Reported User: ${robloxUser}
Violation(s): ${reason}
Evidence: ${evidence.url}
Notes: ${notes}
-# ${timestamp} | Awaiting moderator review
-# CaseID: ${caseID}`;

        const sent = await channel.send(msg);

        await sent.react("✅");
        await sent.react("❌");

        await interaction.editReply(
`<:Check:1473547604921942046> Your Report has been successfully submitted! Our Staff Team will review it within 4 hours to 2 days. You will be sent the official updates on the report via DMs.

If you wish to void this report due to information miscommunication or because it has been already handled, please go to DMs and send:

\`?voidcase ${caseID}\`

You cannot void the report after 3 hours.
-# CaseID: ${caseID}`
        );
    }
};
