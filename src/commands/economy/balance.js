const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'bal',
    aliases: ['balance', 'money'],
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const data = getUser(message.guild.id, target.id);

        const embed = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
            .setColor(0x3b82f6)
            .setDescription('______________________________')
            .addFields(
                { name: 'Cash', value: `**${formatCoins(data?.coins || 0)}** coins`, inline: true },
                { name: 'Bank', value: `**${formatCoins(data?.bank || 0)}** coins`, inline: true },
                { name: 'Net Worth', value: `**${formatCoins((data?.coins || 0) + (data?.bank || 0))}** coins`, inline: true },
                { name: 'Level', value: `**${data?.level || 1}**`, inline: true },
                { name: 'XP', value: `**${data?.xp || 0}**`, inline: true }
            );

        return message.reply({ embeds: [embed] });
    }
};
