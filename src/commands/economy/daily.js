const User = require('../../models/User');

module.exports = {
    name: 'daily',
    async execute(message) {
        let data = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!data) data = await User.create({ userId: message.author.id, guildId: message.guild.id });

        const timeout = 86400000;
        if (data.lastDaily !== null && timeout - (Date.now() - data.lastDaily) > 0) {
            return message.reply("**Kamu sudah mengambil hadiah harian!**");
        }

        const reward = 500;
        data.coins += reward;
        data.lastDaily = Date.now();
        await data.save();

        message.reply(`**Selamat! Kamu mendapatkan 💰 ${reward} koin harian.**`);
    }
};