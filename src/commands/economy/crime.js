const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration, getActiveBoostMultiplier } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'crime',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 45 * 60000;
        const now = Date.now();

        if (data.lastCrime !== null) {
            const remaining = timeout - (now - data.lastCrime);
            if (remaining > 0) {
                return message.reply(`**Crime masih cooldown.** Tunggu **${formatDuration(remaining)}**.`);
            }
        }

        data.lastCrime = now;
        const success = Math.random() < 0.55;
        const boost = getActiveBoostMultiplier(data, 'coin');
        const petPassive = getPetPassive(data, 'crime');
        const amount = Math.floor((500 + Math.floor(Math.random() * 2001)) * boost * petPassive.coinMultiplier);

        if (success) {
            data.coins += amount;
            return message.reply(`**Aksi crime berhasil lolos.**\n> Hasil: +${formatCoins(amount)} coins\n> Pet bonus: x${petPassive.coinMultiplier.toFixed(2)}`);
        }

        const penalty = Math.max(200, Math.floor(amount * 0.6));
        data.coins = Math.max(0, data.coins - penalty);
        return message.reply(`**Kamu tertangkap saat crime.**\n> Denda: -${formatCoins(penalty)} coins`);
    }
};
