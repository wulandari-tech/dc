const { getUser } = require('../../store/runtimeStore');
const { getActiveBoostMultiplier, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'crash',
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || bet < 100) return message.reply('**Gunakan:** `.crash <bet>`');

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) return message.reply('**Coins kamu tidak cukup.**');
        const boost = getActiveBoostMultiplier(data, 'coin');

        const crashPoint = Number((1 + Math.random() * 4.5).toFixed(2));
        const autoCashout = Number((1.2 + Math.random() * 2.8).toFixed(2));

        if (autoCashout < crashPoint) {
            const reward = Math.floor(bet * autoCashout * boost);
            data.coins += reward;
            return message.reply(`**Crash survive.**\n> Cashout di x${autoCashout}\n> Crash di x${crashPoint}\n> Coin boost: x${boost}\n> Menang ${formatCoins(reward)} coins`);
        }

        data.coins -= bet;
        return message.reply(`**Crash meledak duluan.**\n> Cashout target x${autoCashout}\n> Crash di x${crashPoint}\n> Kalah ${formatCoins(bet)} coins`);
    }
};
