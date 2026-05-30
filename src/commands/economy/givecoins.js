const config = require('../../config');
const { PermissionFlagsBits } = require('discord.js');
const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');

function canManageCoins(message) {
    return message.author.id === config.ownerId || message.member.permissions.has(PermissionFlagsBits.Administrator);
}

module.exports = {
    name: 'givecoins',
    aliases: ['addcoins', 'setcoins', 'takecoins'],
    async execute(message, args) {
        if (!canManageCoins(message)) {
            return message.reply('**Hanya owner/admin yang bisa mengelola coins.**');
        }

        const mode = message.content.split(/ +/)[0].slice(1).toLowerCase();
        const target = message.mentions.users.first();
        const amount = Number.parseInt(args[1], 10);

        if (!target || Number.isNaN(amount) || amount <= 0) {
            return message.reply('**Gunakan:** `.givecoins @user <jumlah>`, `.takecoins @user <jumlah>`, atau `.setcoins @user <jumlah>`');
        }

        const data = ensureUser(message.guild.id, target.id);

        if (mode === 'takecoins') {
            data.coins = Math.max(0, data.coins - amount);
            return message.reply(`**Coins dikurangi.**\n> User: ${target.username}\n> Jumlah: ${formatCoins(amount)} coins`);
        }

        if (mode === 'setcoins') {
            data.coins = amount;
            return message.reply(`**Coins di-set.**\n> User: ${target.username}\n> Total baru: ${formatCoins(amount)} coins`);
        }

        data.coins += amount;
        return message.reply(`**Coins ditambahkan.**\n> User: ${target.username}\n> Bonus: ${formatCoins(amount)} coins`);
    }
};
