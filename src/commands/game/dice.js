const { getUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'dice',
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || Number.isNaN(bet) || bet < 100) {
            return message.reply('**Minimal taruhan adalah 💰 100 koin!**');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) {
            return message.reply('**Koin kamu tidak cukup!**');
        }

        const userRoll = Math.floor(Math.random() * 6) + 1;
        const botRoll = Math.floor(Math.random() * 6) + 1;

        let result = `**🎲 DICE ROLL**\n**Kamu:** \`[ ${userRoll} ]\`\n**Bot:** \`[ ${botRoll} ]\`\n\n`;

        if (userRoll > botRoll) {
            const winAmount = userRoll === 6 ? bet * 2 : Math.floor(bet * 1.5);
            data.coins += winAmount;
            result += `**MENANG!** Kamu mendapatkan **💰 ${winAmount}** koin!`;
        } else if (userRoll < botRoll) {
            data.coins -= bet;
            result += `**KALAH!** Kamu kehilangan **💰 ${bet}** koin.`;
        } else {
            result += '**SERI!** Koin kamu aman.';
        }

        return message.reply(result);
    }
};
