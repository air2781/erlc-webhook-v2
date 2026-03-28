const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "cmds",

  run: async (client, message) => {
    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setDescription(
`> The follow commands are as is listed below. Please note that some might be restricted to specific ranks or chain of authority.

**?dice** [4/6/8] - Rolls either a 6, 4, or 8 sided dice, choosing a random number.
**?closethread** - Allows you to close threads opened in staff suggestions.
**?handled** [User_Mention] [Type of Ticket] [Reason For Closure] - Logs tickets quota more easily.
**?cmds** - Allows anyone to see all prefix commands.
**?eventcreate** - Creates an event log.
**?autosupport** - Shows basic data which can speed up time and give more information.
**?eventlogs** - Reveals all event logs of up to 10 pages (50 logs).
**?joke** - Tells you a funny joke.
**?ping** - Shows the ping latency of the bot.
**?fac / randomfac / fact / randomfact / facs** - Shows a random fact.
**?weather** - Shows IRL NYC weather.
**?restart / 0** 
**?genqueue** [i] - Allows staff handling market queues to adjust the status based off of the orders.
**?tts** [input] - Allows you to input a text and have it announced/said in a voice channel. Queue is limited.
**?rtrequest** [mention] [MT/AT/HR/SHR] - Sends an officially formatted retirement message from Cozzy.
**?timeoutvote** - Issues a public timeout vote.
**?fortune** - Gives you advice or wise words.
**?404**
**?402**
**?909**`
      );

    await message.channel.send({ embeds: [embed] });
  }
};
