const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'bal',
    aliases: ['balance', 'money'],
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const data = getUser(message.guild.id, target.id);
        
        const embed = new EmbedBuilder()
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
            .setColor("Blue")
            .addFields(
                { name: '💰 Coins', value: `**${data?.coins || 0}**`, inline: true },
                { name: '🆙 Level', value: `**${data?.level || 1}**`, inline: true },
                { name: '✨ XP', value: `**${data?.xp || 0}**`, inline: true }
            );
            
        message.reply({ embeds: [embed] });
    }
};
