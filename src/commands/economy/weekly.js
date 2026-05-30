const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'weekly',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 7 * 86400000;
        const now = Date.now();

        if (data.lastWeekly !== null) {
            const remaining = timeout - (now - data.lastWeekly);
            if (remaining > 0) {
                return message.reply(`**Weekly sudah diambil.** Klaim berikutnya dalam **${formatDuration(remaining)}**.`);
            }
        }

        const petPassive = getPetPassive(data, 'daily');
        const reward = Math.floor(4000 * petPassive.coinMultiplier);
        data.coins += reward;
        data.lastWeekly = now;

        return message.reply(`**Weekly berhasil diklaim.**\n> Reward: ${formatCoins(reward)} coins\n> Pet bonus: x${petPassive.coinMultiplier.toFixed(2)}`);
    }
};
