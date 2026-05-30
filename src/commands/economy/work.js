const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration, getActiveBoostMultiplier } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'work',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 30 * 60000;
        const now = Date.now();

        if (data.lastWork !== null) {
            const remaining = timeout - (now - data.lastWork);
            if (remaining > 0) {
                return message.reply(`**Kamu baru saja bekerja.** Coba lagi dalam **${formatDuration(remaining)}**.`);
            }
        }

        const jobs = ['designer', 'developer', 'merchant', 'hunter', 'collector', 'strategist', 'animator'];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const boost = getActiveBoostMultiplier(data, 'coin');
        const petPassive = getPetPassive(data, 'work');
        const reward = Math.floor((350 + Math.floor(Math.random() * 651)) * boost * petPassive.coinMultiplier);
        data.lastWork = now;
        data.coins += reward;

        return message.reply(`**Shift selesai sebagai ${job}.**\n> Reward: ${formatCoins(reward)} coins\n> Coin boost: x${boost}\n> Pet bonus: x${petPassive.coinMultiplier.toFixed(2)}`);
    }
};
