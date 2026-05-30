const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    async execute(message, args) {
        const metric = args[0]?.toLowerCase() === 'coins' ? 'coins' : 'level';
        const topUsers = getLeaderboard(message.guild.id, 10, metric);

        if (!topUsers.length) {
            return message.reply('**Papan peringkat masih kosong.**');
        }

        const lines = await Promise.all(topUsers.map(async (user, index) => {
            const member = await message.guild.members.fetch(user.userId).catch(() => null);
            const username = member ? member.user.username : 'Unknown User';
            const prefix = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            if (metric === 'coins') {
                return `${prefix} **${username}** - ${formatCoins(user.coins + user.bank)} coins`;
            }

            return `${prefix} **${username}** - Level ${user.level} (XP ${user.xp})`;
        }));

        const embed = new EmbedBuilder()
            .setTitle(metric === 'coins' ? 'Leaderboard Coins' : 'Leaderboard Level')
            .setColor(metric === 'coins' ? 0xeab308 : 0x6366f1)
            .setDescription(lines.join('\n'));

        return message.reply({ embeds: [embed] });
    }
};
