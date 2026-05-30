const { getUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'tower',
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || bet < 100) return message.reply('**Gunakan:** `.tower <bet>`');

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) return message.reply('**Coins kamu tidak cukup.**');

        const floors = [
            { chance: 0.85, multiplier: 1.2 },
            { chance: 0.7, multiplier: 1.7 },
            { chance: 0.55, multiplier: 2.4 },
            { chance: 0.4, multiplier: 3.2 }
        ];

        let cleared = 0;
        for (const floor of floors) {
            if (Math.random() <= floor.chance) cleared += 1;
            else break;
        }

        if (!cleared) {
            data.coins -= bet;
            return message.reply(`**Tower runtuh di lantai 1.**\n> Kalah ${bet} coins`);
        }

        const multiplier = floors[cleared - 1].multiplier;
        const reward = Math.floor(bet * multiplier);
        data.coins += reward;
        return message.reply(`**Tower clear ${cleared} lantai.**\n> Multiplier x${multiplier}\n> Menang ${reward} coins`);
    }
};
