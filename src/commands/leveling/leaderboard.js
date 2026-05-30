const User = require('../../models/User');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    async execute(message) {
        const topUsers = await User.find({ guildId: message.guild.id })
            .sort({ level: -1, xp: -1 })
            .limit(10);

        if (!topUsers.length) return message.reply("**Papan peringkat masih kosong.**");

        const lbData = await Promise.all(topUsers.map(async (u, index) => {
            const member = await message.guild.members.fetch(u.userId).catch(() => null);
            const username = member ? member.user.username : "Unknown User";
            
            let medal = "";
            if (index === 0) medal = "🥇";
            else if (index === 1) medal = "🥈";
            else if (index === 2) medal = "🥉";
            else medal = `**#${index + 1}**`;

            return `${medal} **${username}** — **Level ${u.level}** (XP: **${u.xp}**)`;
        }));

        const embed = new EmbedBuilder()
            .setTitle(`🏆 **TOP 10 LEADERBOARD - ${message.guild.name.toUpperCase()}**`)
            .setColor("Gold")
            .setDescription(lbData.join('\n'))
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.username}` });

        message.reply({ embeds: [embed] });
    }
};