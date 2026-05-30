const User = require('../../models/User');

module.exports = {
    name: 'dice',
    async execute(message, args) {
        const bet = parseInt(args[0]);
        if (!bet || isNaN(bet) || bet < 100) return message.reply("**Minimal taruhan adalah 💰 100 koin!**");

        let data = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!data || data.coins < bet) return message.reply("**Koin kamu tidak cukup!**");

        const uRoll = Math.floor(Math.random() * 6) + 1;
        const bRoll = Math.floor(Math.random() * 6) + 1;

        let resultMsg = `**🎲 DICE ROLL**\n**Kamu:** \`[ ${uRoll} ]\`\n**Bot:** \`[ ${bRoll} ]\`\n\n`;

        if (uRoll > bRoll) {
            const winAmount = uRoll === 6 ? bet * 2 : Math.floor(bet * 1.5);
            data.coins += winAmount;
            resultMsg += `**MENANG!** Kamu mendapatkan **💰 ${winAmount}** koin! (Bonus x2 jika roll 6)`;
        } else if (uRoll < bRoll) {
            data.coins -= bet;
            resultMsg += `**KALAH!** Kamu kehilangan **💰 ${bet}** koin.`;
        } else {
            resultMsg += `**SERI!** Koin kamu aman.`;
        }

        await data.save();
        message.reply(resultMsg);
    }
};