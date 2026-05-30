const User = require('../../models/User');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bal',
    aliases: ['balance', 'money'],
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const data = await User.findOne({ userId: target.id, guildId: message.guild.id });
        
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