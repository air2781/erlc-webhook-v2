module.exports = {
  name: "rtrequest",
  async run(client, message, args) {

    const allowedRoles = [
      "1314418348729040946",
      "1342948037382901901",
      "1460517136241004574",
      "1290085306619396181"
    ];

    const logChannelId = "1312842507436167234";

    const hasPerms = member =>
      member.permissions.has("Administrator") ||
      member.roles.cache.some(r => allowedRoles.includes(r.id));

    if (!hasPerms(message.member))
      return message.reply("You do not have permission to use this command.");

    const target =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    const type = args[1]?.toUpperCase();

    if (!target || !["MT", "AT", "HR", "SHR"].includes(type))
      return message.reply("Incorrect format. Use ?rtrequest [@mention/UserID] [Type MT/AT/HR/SHR]");

    if (!hasPerms(target))
      return message.reply("❌ The mentioned user does not have the required role.");

    let retirementMsg;

    if (type === "MT" || type === "AT") {
      retirementMsg = 
`# Retirement
> **Greetings, ${target}**
> 
> Before you continue your retirement plan. I, Cozzy, would like to formally talk to you for one last time.
> 
> Your time here working at NYC:RP had created a lot of benefit for not us, but you. Your staff position permitted you to help people, moderate role breakers, and help us try to reach goals, such goals that we thought were beyond our limits. 
> 
> Your interactions, hours of hard-work, and voluntery service has truly left a remark on our server. Though I as the Founder, might not have known you as well, I do appreciate your presence and all the help you gave me, and I mean it personally.
> 
> Thank you, and I hope that as you continue to move forward, you have a wonderful lifetime and with it being exciting, interesting, and grateful. 
> 
> **Sincerely, Cozzy**
> -# This message is prewritten and automated. No information is and within any sort of insult or disregard. Your help has inspired many, and we hope we satisfy your expectations.`;
    } else {
      retirementMsg =
`# Retirement
> **Hey ${target},**
> 
> I, the founder of NYC:RP (Cozzy) have one final thing to say to you before you resign.
> 
> Look, I won't stop you from retiring or resigning, as you have that right and I fully respect it. I just want to personally thank you for your support and taking so much time here, working your butt off in making our server so big, beyond goals no one could've imagined to reach.
> 
> Your efforts in handling tickets, infracting staff, advising people, participating or hosting events, etc have created from what others see as small, but I personally think it's huge. 
> 
> Thank you so much for helping us out, and I do look forward to you coming back and reinstating. Please at least check in time to time with us through general, and we truly hope for the best of your future.
> 
> **Signed, Cozzy**
> -# This message is prewritten and automated. No information is and within any sort of insult or disregard. Your help has inspired many, and we hope we satisfy your expectations.`;
    }

    // Send retirement message in current channel
    await message.channel.send(retirementMsg);

    // Log it
    const logChannel = await client.channels.fetch(logChannelId);
    if (logChannel) {
      logChannel.send(
        `${message.author} ran ?rtrequest on ${target} (${target.id}). The type they selected was ${type}`
      );
    }
  }
};
