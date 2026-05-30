const { getUser } = require('../../store/runtimeStore');
const { getActiveBoostMultiplier, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'guess',
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        const guess = Number.parseInt(args[1], 10);
        if (!bet || bet < 100 || !guess || guess < 1 || guess > 10) {
            return message.reply('**Gunakan:** `.guess <bet> <angka 1-10>`');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) return message.reply('**Coins kamu tidak cukup.**');
        const boost = getActiveBoostMultiplier(data, 'coin');

        const answer = Math.floor(Math.random() * 10) + 1;
        if (guess === answer) {
            const reward = Math.floor(bet * 4 * boost);
            data.coins += reward;
            return message.reply(`**Guess benar.**\n> Angka: ${answer}\n> Coin boost: x${boost}\n> Menang ${formatCoins(reward)} coins`);
        }

        if (Math.abs(guess - answer) === 1) {
            const reward = Math.floor(bet * 1.2 * boost);
            data.coins += reward;
            return message.reply(`**Hampir benar.**\n> Angka: ${answer}\n> Bonus ${formatCoins(reward)} coins`);
        }

        data.coins -= bet;
        return message.reply(`**Guess salah.**\n> Angka: ${answer}\n> Hilang ${formatCoins(bet)} coins`);
    }
};
