const { getUser } = require('../../store/runtimeStore');
const { getActiveBoostMultiplier, formatCoins } = require('../../utils/economy');

const SYMBOLS = ['🍒', '⭐', '💎', '🍀', '7️⃣'];

module.exports = {
    name: 'slots',
    aliases: ['slot'],
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || bet < 100) {
            return message.reply('**Minimal taruhan slots adalah 100 coins.**');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) {
            return message.reply('**Coins kamu tidak cukup untuk slots.**');
        }
        const boost = getActiveBoostMultiplier(data, 'coin');

        const rolls = Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        const allSame = rolls.every((item) => item === rolls[0]);
        const pair = new Set(rolls).size === 2;

        let reward = 0;
        if (allSame) reward = Math.floor(bet * 3 * boost);
        else if (pair) reward = Math.floor(bet * 1.5 * boost);

        if (reward > 0) {
            data.coins += reward;
            return message.reply(`**SLOTS**\n> ${rolls.join(' | ')}\n> Coin boost: x${boost}\n> Menang: +${formatCoins(reward)} coins`);
        }

        data.coins -= bet;
        return message.reply(`**SLOTS**\n> ${rolls.join(' | ')}\n> Kalah: -${formatCoins(bet)} coins`);
    }
};
