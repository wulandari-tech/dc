const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'withdraw',
    aliases: ['wd'],
    async execute(message, args) {
        const data = ensureUser(message.guild.id, message.author.id);
        const amount = args[0] === 'all' ? data.bank : Number.parseInt(args[0], 10);

        if (!amount || amount <= 0 || data.bank < amount) {
            return message.reply('**Jumlah withdraw tidak valid.**\n> Gunakan: `.withdraw <jumlah|all>`');
        }

        data.bank -= amount;
        data.coins += amount;
        return message.reply(`**Withdraw berhasil.**\n> ${formatCoins(amount)} coins keluar dari bank`);
    }
};
