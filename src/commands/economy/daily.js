const { ensureUser } = require('../../store/runtimeStore');
const { formatDuration, formatCoins } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'daily',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 86400000;
        const now = Date.now();

        if (data.lastDaily !== null) {
            const remaining = timeout - (now - data.lastDaily);
            if (remaining > 0) {
                return message.reply(`**Daily sudah diambil.** Klaim berikutnya dalam **${formatDuration(remaining)}**.`);
            }
        }

        const petPassive = getPetPassive(data, 'daily');
        const reward = Math.floor(500 * petPassive.coinMultiplier);
        data.coins += reward;
        data.lastDaily = now;

        return message.reply(`**Daily berhasil diklaim.**\n> Reward: ${formatCoins(reward)} coins\n> Pet bonus: x${petPassive.coinMultiplier.toFixed(2)}`);
    }
};
