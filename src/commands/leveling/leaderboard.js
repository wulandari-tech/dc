const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../store/runtimeStore');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    async execute(message) {
        const topUsers = getLeaderboard(message.guild.id, 10);
        if (!topUsers.length) {
            return message.reply('**Papan peringkat masih kosong.**');
        }

        const lines = await Promise.all(topUsers.map(async (user, index) => {
            const member = await message.guild.members.fetch(user.userId).catch(() => null);
            const username = member ? member.user.username : 'Unknown User';

            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `**#${index + 1}**`;

            return `${medal} **${username}** - **Level ${user.level}** (XP: **${user.xp}**)`;
        }));

        const embed = new EmbedBuilder()
            .setTitle(`🏆 **TOP 10 LEADERBOARD - ${message.guild.name.toUpperCase()}**`)
            .setColor('Gold')
            .setDescription(lines.join('\n'))
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}` });

        return message.reply({ embeds: [embed] });
    }
};
