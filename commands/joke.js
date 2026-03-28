const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Tells a random joke"),
  name: "joke", // for !joke message command
  description: "Tells a random joke",
  run: async (interactionOrMessage, client, isMessage = false) => {
    const jokes = [
      "Do you want to hear a pizza joke? Nahhh, it's too cheesy!",
      "What did the buffalo say when his son left? Bison!",
      "What do you call a cold dog? A chili dog.",
      "Where do you learn to make banana splits? At sundae school.",
      "What do you call a lion with no eyes? Lon.",
      "What did one ocean say to the other? Nothing, they just waved.",
      "Why are horses so sleepy? They’re always hitting the hay.",
      "What did one hat say to the other? You wait here. I’ll go on a head.",
      "What insect is the sneakiest? Spy‑ders.",
      "Why was the broom late for work? It over‑swept.",
      "Why did the scarecrow win an award? Because he was outstanding in his field.",
      "What do you call a well‑balanced horse? Stable.",
      "What do you call an angry carrot? A steamed veggie.",
      "Where do polar bears keep their money? In a snowbank.",
      "What do you call a pile of cats? A meow‑ntain.",
      "Why do cows wear bells? Because their horns don’t work.",
      "What did the bicycle fall over? Because it was two‑tired.",
      "What did the triangle say to the circle? You’re pointless.",
      "What do you call a fish without an eye? Fsh!",
      "Why did the tomato turn red? Because it saw the salad dressing!",
      "What’s the difference between a poorly dressed man on a tricycle and a well‑dressed man on a bicycle? Attire.",
      "What’s red and bad for your teeth? A brick.",
      "What do sprinters eat before they race? Nothing. They fast.",
      "What has more lives than a cat? A frog, because it croaks every day.",
      "Why are trees so unreliable? They’re shady.",
      "What's the best time to go to the dentist? Tooth‑hurty!",
      "Why did the two rabbits get on so well? Love was in the hare.",
      "What’s it called when french fries hang out? A ketchup.",
      "What do you call two birds in love? Tweethearts.",
      "How does NASA organize a party? They planet.",
      "Why did the developer go broke? Because he used up all his cache.",
      "What do computers like to eat? Chips.",
      "Where will you find Friday before Thursday? A dictionary.",
      "I pity the calendar. Its days are numbered.",
      "What do you call a magician that loses his magic? Ian.",
      "What’s a ballerina’s favorite number? Two‑two.",
      "Why did the picture go to jail? Because it was framed.",
      "Why is it so cheap to throw a party at a haunted house? Because the ghosts bring all the boos!",
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const emojis = [
      "<:Check:1478581031971061983>",
      "<:ErrorX:1473547704444653568>",
      "<:ErrorX:1473547704444653568>"
    ];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const replyText = `${emoji} ${joke}`;

    if (isMessage) {
      try {
        await interactionOrMessage.channel.send(replyText);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        await interactionOrMessage.reply({ content: replyText }).catch(() => {});
      } catch {}
    }
  }
};