const { getUser } = require('../../store/runtimeStore');
const { getActiveBoostMultiplier, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'dice',
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || Number.isNaN(bet) || bet < 100) {
            return message.reply('**Minimal taruhan dice adalah 100 coins.**');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) {
            return message.reply('**Coins kamu tidak cukup.**');
        }

        const userRoll = Math.floor(Math.random() * 6) + 1;
        const botRoll = Math.floor(Math.random() * 6) + 1;
        const boost = getActiveBoostMultiplier(data, 'coin');

        let result = `**DICE ROLL**\n> Kamu: [ ${userRoll} ]\n> Bot: [ ${botRoll} ]\n`;

        if (userRoll > botRoll) {
            const winAmount = Math.floor((userRoll === 6 ? bet * 2 : bet * 1.5) * boost);
            data.coins += winAmount;
            result += `> Menang: ${formatCoins(winAmount)} coins\n> Coin boost: x${boost}`;
        } else if (userRoll < botRoll) {
            data.coins -= bet;
            result += `> Kalah: ${formatCoins(bet)} coins`;
        } else {
            result += '> Seri: coins aman';
        }

        return message.reply(result);
    }
};
