const { PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { addWarning, getWarnings, removeWarning } = require('../../store/runtimeStore');

function buildModHelpEmbed() {
    return new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('Moderation Commands')
        .setDescription([
            '> `.mod kick @user [alasan]`',
            '> `.mod ban @user [alasan]`',
            '> `.mod unban <userId>`',
            '> `.mod timeout @user <menit> [alasan]`',
            '> `.mod untimeout @user`',
            '> `.mod clear <jumlah>`',
            '> `.mod nick @user <nama>`',
            '> `.mod warn @user [alasan]`',
            '> `.mod unwarn @user`',
            '> `.mod warnings @user`',
            '> `.mod lock`',
            '> `.mod unlock`',
            '> `.mod slowmode <detik>`',
            '> `.mod role add @user @role`',
            '> `.mod role remove @user @role`',
            '> `.mod announce <teks>`',
            '> `.mod hide #channel`',
            '> `.mod unhide #channel`'
        ].join('\n'));
}

module.exports = {
    name: 'mod',
    description: 'Advanced Moderation System',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('**Kamu tidak memiliki izin Administrator.**');
        }

        const action = args[0]?.toLowerCase();
        if (!action) return message.reply({ embeds: [buildModHelpEmbed()] });

        const target = message.mentions.members.first();

        if (action === 'kick') {
            const reason = args.slice(2).join(' ') || 'No reason provided';
            if (!target) return message.reply('**Tag member yang ingin di-kick.**');
            await target.kick(reason);
            return message.reply(`**Kick berhasil:** ${target.user.tag}\n> Reason: ${reason}`);
        }

        if (action === 'ban') {
            const reason = args.slice(2).join(' ') || 'No reason provided';
            if (!target) return message.reply('**Tag member yang ingin di-ban.**');
            await target.ban({ reason });
            return message.reply(`**Ban berhasil:** ${target.user.tag}\n> Reason: ${reason}`);
        }

        if (action === 'unban') {
            const userId = args[1];
            if (!userId || !/^\d+$/.test(userId)) return message.reply('**Masukkan user ID yang valid.**');
            await message.guild.members.unban(userId);
            return message.reply(`**Unban berhasil untuk user ID:** ${userId}`);
        }

        if (action === 'timeout' || action === 'mute') {
            const duration = Number.parseInt(args[2], 10) || 60;
            const reason = args.slice(3).join(' ') || 'No reason provided';
            if (!target) return message.reply('**Tag member yang ingin di-timeout.**');
            await target.timeout(duration * 60000, reason);
            return message.reply(`**Timeout berhasil:** ${target.user.tag}\n> Durasi: ${duration} menit\n> Reason: ${reason}`);
        }

        if (action === 'untimeout') {
            if (!target) return message.reply('**Tag member yang ingin dihapus timeout-nya.**');
            await target.timeout(null);
            return message.reply(`**Timeout dihapus untuk:** ${target.user.tag}`);
        }

        if (action === 'clear') {
            const amount = Number.parseInt(args[1], 10);
            if (Number.isNaN(amount) || amount < 1 || amount > 100) return message.reply('**Jumlah clear harus 1 sampai 100.**');
            await message.channel.bulkDelete(amount, true);
            return message.channel.send(`**Berhasil menghapus ${amount} pesan.**`).then((msg) => setTimeout(() => msg.delete().catch(() => {}), 3000));
        }

        if (action === 'nick') {
            const nickname = args.slice(2).join(' ').trim();
            if (!target || !nickname) return message.reply('**Gunakan:** `.mod nick @user <nama>`');
            await target.setNickname(nickname);
            return message.reply(`**Nickname diperbarui:** ${target.user.tag}\n> Nama baru: ${nickname}`);
        }

        if (action === 'warn') {
            const reason = args.slice(2).join(' ') || 'No reason provided';
            if (!target) return message.reply('**Tag member yang ingin di-warn.**');
            const warnings = addWarning(message.guild.id, target.id, reason, message.author.id);
            return message.reply(`**Warn ditambahkan untuk ${target.user.tag}.**\n> Total warn: ${warnings.length}\n> Reason: ${reason}`);
        }

        if (action === 'unwarn') {
            if (!target) return message.reply('**Tag member yang ingin dihapus warning terakhirnya.**');
            const warnings = removeWarning(message.guild.id, target.id);
            return message.reply(`**Warning terakhir dihapus untuk ${target.user.tag}.**\n> Sisa warn: ${warnings.length}`);
        }

        if (action === 'warnings') {
            if (!target) return message.reply('**Tag member yang ingin dilihat warning-nya.**');
            const warnings = getWarnings(message.guild.id, target.id);
            if (!warnings.length) return message.reply('**User ini belum punya warning.**');
            return message.reply(`**Warnings ${target.user.tag}**\n${warnings.map((warn, index) => `> ${index + 1}. ${warn.reason}`).join('\n')}`);
        }

        if (action === 'lock') {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            return message.reply('**Channel ini dikunci.**');
        }

        if (action === 'unlock') {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
            return message.reply('**Channel ini dibuka lagi.**');
        }

        if (action === 'slowmode') {
            const seconds = Number.parseInt(args[1], 10);
            if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply('**Slowmode harus 0 sampai 21600 detik.**');
            await message.channel.setRateLimitPerUser(seconds);
            return message.reply(`**Slowmode diatur ke ${seconds} detik.**`);
        }

        if (action === 'role') {
            const roleAction = args[1]?.toLowerCase();
            const role = message.mentions.roles.first();
            if (!target || !role || !['add', 'remove'].includes(roleAction)) {
                return message.reply('**Gunakan:** `.mod role <add/remove> @user @role`');
            }
            if (roleAction === 'add') await target.roles.add(role);
            else await target.roles.remove(role);
            return message.reply(`**Role ${roleAction} berhasil.**\n> User: ${target.user.tag}\n> Role: ${role.name}`);
        }

        if (action === 'announce') {
            const text = args.slice(1).join(' ').trim();
            if (!text) return message.reply('**Masukkan teks announce.**');
            await message.channel.send(`📢 **ANNOUNCEMENT**\n${text}`);
            return message.reply('**Announcement dikirim.**');
        }

        if (action === 'hide' || action === 'unhide') {
            const channel = message.mentions.channels.first() || message.channel;
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: action === 'hide' ? false : null });
            return message.reply(`**Channel ${channel.name} berhasil di-${action}.**`);
        }

        return message.reply({ embeds: [buildModHelpEmbed()] });
    }
};
