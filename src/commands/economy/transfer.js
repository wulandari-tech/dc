const User = require('../../models/User');

module.exports = {
    name: 'transfer',
    aliases: ['pay'],
    async execute(message, args) {
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!target || isNaN(amount) || amount <= 0) return message.reply("**Format salah! Gunakan: .transfer @user [jumlah]**");
        if (target.id === message.author.id) return message.reply("**Tidak bisa transfer ke diri sendiri!**");

        const sender = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!sender || sender.coins < amount) return message.reply("**Koin kamu tidak cukup!**");

        await User.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $inc: { coins: amount } }, { upsert: true });
        sender.coins -= amount;
        await sender.save();

        message.reply(`**Berhasil mentransfer 💰 ${amount} koin ke ${target.username}.**`);
    }
};