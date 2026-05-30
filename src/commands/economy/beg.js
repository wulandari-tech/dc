const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration, getActiveBoostMultiplier } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'beg',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 10 * 60000;
        const now = Date.now();

        if (data.lastBeg !== null) {
            const remaining = timeout - (now - data.lastBeg);
            if (remaining > 0) {
                return message.reply(`**Beg masih cooldown.** Tunggu **${formatDuration(remaining)}**.`);
            }
        }

        const boost = getActiveBoostMultiplier(data, 'coin');
        const petPassive = getPetPassive(data, 'beg');
        const reward = Math.floor((75 + Math.floor(Math.random() * 176)) * boost * petPassive.coinMultiplier);
        data.lastBeg = now;
        data.coins += reward;
        return message.reply(`**Ada yang iba padamu.**\n> Kamu mendapat ${formatCoins(reward)} coins\n> Coin boost: x${boost}\n> Pet bonus: x${petPassive.coinMultiplier.toFixed(2)}`);
    }
};
