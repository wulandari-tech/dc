const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration, getActiveBoostMultiplier } = require('../../utils/economy');

module.exports = {
    name: 'rob',
    async execute(message) {
        const target = message.mentions.users.first();
        if (!target || target.id === message.author.id) {
            return message.reply('**Format rob salah.**\n> Gunakan: `.rob @user`');
        }

        const robber = ensureUser(message.guild.id, message.author.id);
        const victim = ensureUser(message.guild.id, target.id);
        const timeout = 60 * 60000;
        const now = Date.now();

        if (robber.lastRob !== null) {
            const remaining = timeout - (now - robber.lastRob);
            if (remaining > 0) {
                return message.reply(`**Rob masih cooldown.** Tunggu **${formatDuration(remaining)}**.`);
            }
        }

        robber.lastRob = now;
        if (robber.coins < 750) {
            return message.reply('**Rob butuh modal dan nyali.**\n> Minimal punya 750 coins sebelum mulai merampok.');
        }

        if (victim.coins < 500) {
            return message.reply('**Target terlalu miskin untuk dirob.**');
        }

        const success = Math.random() < 0.45;
        const boost = getActiveBoostMultiplier(robber, 'coin');
        const amount = Math.floor((300 + Math.floor(Math.random() * Math.min(2000, victim.coins))) * boost);

        if (success) {
            victim.coins -= amount;
            robber.coins += amount;
            return message.reply(`**Rob berhasil.**\n> Target: ${target.username}\n> Rampasan: ${formatCoins(amount)} coins\n> Coin multiplier: x${boost}`);
        }

        const penalty = Math.max(200, Math.floor(amount * 0.5));
        robber.coins = Math.max(0, robber.coins - penalty);
        victim.coins += Math.floor(penalty * 0.4);
        return message.reply(`**Rob gagal.**\n> Target melawan balik dan memanggil penjaga.\n> Kamu kehilangan ${formatCoins(penalty)} coins`);
    }
};
