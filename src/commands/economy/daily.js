const { ensureUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'daily',
    async execute(message) {
        const data = ensureUser(message.guild.id, message.author.id);
        const timeout = 86400000;

        if (data.lastDaily !== null && timeout - (Date.now() - data.lastDaily) > 0) {
            return message.reply('**Kamu sudah mengambil hadiah harian!**');
        }

        const reward = 500;
        data.coins += reward;
        data.lastDaily = Date.now();

        return message.reply(`**Selamat! Kamu mendapatkan 💰 ${reward} koin harian.**`);
    }
};
