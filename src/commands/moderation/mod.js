const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mod',
    description: 'Advanced Moderation System',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) 
            return message.reply("**Kamu tidak memiliki izin Administrator!**");

        const action = args[0];
        const target = message.mentions.members.first();
        const reason = args.slice(2).join(" ") || "No reason provided";

        if (action === 'kick') {
            if (!target) return message.reply("**Tag member! .mod kick @user [alasan]**");
            await target.kick(reason);
            message.reply(`**Kicked ${target.user.tag} | Reason: ${reason}**`);
        } 
        
        else if (action === 'ban') {
            if (!target) return message.reply("**Tag member! .mod ban @user [alasan]**");
            await target.ban({ reason });
            message.reply(`**Banned ${target.user.tag} | Reason: ${reason}**`);
        } 

        else if (action === 'mute') {
            if (!target) return message.reply("**Tag member! .mod mute @user [menit] [alasan]**");
            const duration = parseInt(args[2]) || 60;
            await target.timeout(duration * 60000, reason);
            message.reply(`**Muted ${target.user.tag} selama ${duration} menit | Reason: ${reason}**`);
        }

        else if (action === 'clear') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount > 100) return message.reply("**Maksimal hapus 100 pesan!**");
            await message.channel.bulkDelete(amount, true);
            message.channel.send(`**Berhasil menghapus ${amount} pesan!**`).then(m => setTimeout(() => m.delete(), 3000));
        }
    }
};