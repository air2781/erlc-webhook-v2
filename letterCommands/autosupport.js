const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const ALLOWED_IDS = [
  "1314418348729040946",
  "1460517136241004574",
  "1290085306619396181"
];

module.exports = {
  name: "autosupport",

  run: async (client, message) => {
    const allowed =
      message.member.permissions.has("Administrator") ||
      message.member.roles.cache.some(r => ALLOWED_IDS.includes(r.id));

    if (!allowed) return;

    const mainEmbed = new EmbedBuilder()
      .setTitle("Auto Support")
      .setColor("Yellow")
      .setDescription(
        `> Choose support sources below. It might not be up to date, so please be advised.`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("autosupport_menu")
      .setPlaceholder("Select a support category")
      .addOptions([
        {
          label: "Staff / IA Application / Ban Appeal",
          value: "applications"
        },
        {
          label: "Final Decision & Lead",
          value: "final"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const msg = await message.channel.send({
      embeds: [mainEmbed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({
      time: 5 * 60 * 1000
    });

    collector.on("collect", async interaction => {
      if (interaction.customId !== "autosupport_menu") return;

      const allowedUser =
        interaction.member.permissions.has("Administrator") ||
        interaction.member.roles.cache.some(r => ALLOWED_IDS.includes(r.id));

      if (!allowedUser) {
        return interaction.reply({
          content: "❌ You cannot use this menu.",
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      let embed;

      // ===================== OPTION 1 =====================
      if (interaction.values[0] === "applications") {
        embed = new EmbedBuilder()
          .setTitle("Auto Support")
          .setColor("Yellow")
          .setDescription(
`> **Staff / IA Application / Ban Appeal**

> To become a **NYC:RP Staff Member**, you can apply at https://melonly.xyz/forms/7324268282796576768. This link will guide you to an application which must be filled out. Once you have filled it out, do not ask us for your application status, when applications are read, and if we gone through yours yet. Hinting or asking so will result in a staff blacklist. All staff applications are read every Friday. If you do not get any response after 12 days, please open a ticket and then ask.

> To become a **Internal Affairs Intern**, you can apply at https://melonly.xyz/forms/7365189591743074304. It takes them up to 14 days to read your application or sooner. If they do not get back to you, whether it's application status or Melonly Status after 15 days, please open a IA ticket and ask. Otherwise for the time being, asking will be seen as hinting and result in a IA Blacklist.

> **Ban Appeals** are only permittable if you were banned and are appealing within the year of the ban, the ban isn't involving hate crime or law violation, and/or extreme TOS violation of Discord or Roblox. Ban appeals are reviewed every Friday or holiday, but even then you may not hint, request, or ask for us to read your application. If your application is not heard of or you get no information of its status after 12 days of submission, then you may open a ticket and ask. 
> -# Please note that ban appeals have some minor security features, such as new joiners having to be in the server for 10 days or longer, or have trouble when its a new Discord account that joined recently.`
          );
      }

      // ===================== OPTION 2 =====================
      if (interaction.values[0] === "final") {
        embed = new EmbedBuilder()
          .setTitle("Auto Support")
          .setColor("Yellow")
          .setDescription(
`> **Final Decision & Lead**

**Appeals**
> All appeals final decision making is the **Foundation Team**. Although, that is only for extreme or complicated cases, as usually it would be the **Directive Team**.

**High Ranks Punishment**
> All reports on Management and their punishment(s) is decided by the **Management Director**, overseed and with the advice/recommendation of the **Board of Executives**.

**Staff Punishment**
> The highest rank in-charge of punishment and its type is by the **Director of NYC:RP**, or the Directive in-charge of such.

**Department Regulation**
> **New York Management (Usually Directives)** have the highest permission regulated by the Department Regulations & Act. This includes every rank as well as the Assistant and Co-Founder. Only such unregulation can be done by the Founder himself.

**Employee Commission Guidelines**
> The highest and most honourable President of the Commission is the **President** himself. They may regulate and remove any and all employees during an act of violation.`
          );
      }

      // 🔁 REPLACE CONTENT & REMOVE MENU
      await msg.edit({
        embeds: [embed],
        components: []
      });

      collector.stop();
    });
  }
};
