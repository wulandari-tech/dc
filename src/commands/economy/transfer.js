const { ensureUser, getUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'transfer',
    aliases: ['pay'],
    async execute(message, args) {
        const target = message.mentions.users.first();
        const amount = Number.parseInt(args[1], 10);

        if (!target || Number.isNaN(amount) || amount <= 0) {
            return message.reply('**Format salah.**\n> Gunakan: `.transfer @user <jumlah>`');
        }

        if (target.id === message.author.id) {
            return message.reply('**Tidak bisa transfer ke diri sendiri.**');
        }

        const sender = getUser(message.guild.id, message.author.id);
        if (!sender || sender.coins < amount) {
            return message.reply('**Coins kamu tidak cukup.**');
        }

        const receiver = ensureUser(message.guild.id, target.id);
        sender.coins -= amount;
        receiver.coins += amount;

        return message.reply(`**Transfer berhasil.**\n> ${formatCoins(amount)} coins dikirim ke ${target.username}`);
    }
};
