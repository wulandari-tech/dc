const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'rank',
    aliases: ['level', 'lv'],
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const data = getUser(message.guild.id, target.id);

        if (!data) {
            return message.reply('**User ini belum memiliki data aktivitas chat.**');
        }

        const xpNeeded = data.level * 1000;
        const percentage = Math.floor((data.xp / xpNeeded) * 100);
        const progress = Math.floor((data.xp / xpNeeded) * 10);
        const bar = '#'.repeat(progress) + '-'.repeat(10 - progress);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Rank Card - ${target.username}`, iconURL: target.displayAvatarURL() })
            .setColor('#5865F2')
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: 'Level', value: `**${data.level}**`, inline: true },
                { name: 'Experience', value: `**${data.xp} / ${xpNeeded} XP**`, inline: true },
                { name: 'Progress', value: `**${bar} [${percentage}%]**`, inline: false }
            )
            .setFooter({ text: 'Keep chatting to level up!' });

        return message.reply({ embeds: [embed] });
    }
};
