module.exports = {
    name: ["restart", "100", "0"],

    run: async (client, message) => {

        // ONLY YOU
        if (message.author.id !== "942789806818213949") return;

        await message.reply("Forceful Restart **successfully** executed.")
            .catch(() => {});

        // Small delay so message sends before restart
        setTimeout(() => {
            console.log("[DISCORD] Forceful restart triggered by owner.");
            process.exit(1);
        }, 1500);
    }
};
