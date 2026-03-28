const { SlashCommandBuilder } = require("discord.js");

const facts = [
    "Bald eagles mate for life.",
    "There's a statue of Jason Voorhees, the “Friday the 13th” serial killer, chained to the bottom of a Minnesota lake.",
    "Abraham Lincoln was a licensed bartender.",
    "During his entire lifetime, Vincent Van Gogh is known to have sold only a single painting.",
    "Queen lead singer Freddie Mercury was born with four extra teeth in his upper jaw giving him his distinct smile.",
    "Sir Isaac Newton invented the color wheel in 1666.",
    "The oldest living land animal on earth is a 192-year-old tortoise named Jonathan.",
    "The hardest bone in the human body is the femur.",
    "A group of owls is called a parliament.",
    "The deepest part of the ocean is approximately 35,876 feet down.",
    "A silverback gorilla can lift over 1,763 pounds.",
    "The longest over-water flight without alternate airports is from the coast of California to Honolulu, Hawaii.",
    "“Yesterday” by The Beatles is considered the most covered song in music history.",
    "Australia is wider than the moon.",
    "Venus is the only planet to spin clockwise.",
    "Allodoxaphobia is the fear of other people’s opinions.",
    "Human teeth are the only part of the body that cannot heal themselves.",
    "Competitive art used to be an Olympic sport.",
    "The specks on strawberries are single seeds called achenes.",
    "After Steve Carell left “The Office,” James Gandolfini of the “Sopranos” was reportedly offered the role and turned it down.",
    "Clarinets are made almost entirely out of wood from the mpingo tree.",
    "The first successful electric car in the U.S. was made by chemist William Morrison in 1890.",
    "At around 22 months, elephants have the longest gestation period of any mammal on earth.",
    "It takes roughly 540 peanuts to make a jar of peanut butter.",
    "Actor Roy Scheider improvised the famous “Jaws” quote, “You’re gonna need a bigger boat.”",
    "In 1971, astronaut Alan Shepard played golf on the moon.",
    "Ferret-legging is a endurance sport in which competitors attempt to keep ferrets trapped in their pants for as long as possible."
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("randomfact")
        .setDescription("Get a random fact!"),
    run: async (interaction) => {
        try {
            const fact = facts[Math.floor(Math.random() * facts.length)];
            await interaction.reply(`💡 ${fact}`);
        } catch (err) {
            console.error("RandomFact command error:", err);
        }
    }
};
