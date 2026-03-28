const cooldowns = new Map();

function checkCooldown(userId, commandName, duration = 3000) {
    const key = `${userId}-${commandName}`;
    
    if (cooldowns.has(key)) {
        return true;
    }

    cooldowns.set(key, true);
    setTimeout(() => cooldowns.delete(key), duration);
    return false;
}

module.exports = { checkCooldown };
