const CHANNEL_ID = "1320570118920470599";

const reminderMsg = `-# **Reminder:** You can log roleplays using ?rplog [Username(s)] [Type] [Postal] [Y/N]. For more details, run just ?rplog or an incorrect format. It does support multiple users and multiple words.`;

let messageCount = 0;
let target = getRandomTarget();

function getRandomTarget() {
  return Math.floor(Math.random() * 4) + 5; // 5–8
}

module.exports = async (client, message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  // ✅ ONLY count messages in the RP log channel
  if (message.channel.id !== CHANNEL_ID) return;

  messageCount++;

  if (messageCount >= target) {
    try {
      await message.channel.send(reminderMsg);
    } catch {}

    // 🔁 reset properly
    messageCount = 0;
    target = getRandomTarget();
  }
};
