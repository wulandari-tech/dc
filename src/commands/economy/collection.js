const User = require('../../models/User');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'collection',
    aliases: ['inv'],
    async execute(message) {
        const data = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!data || data.inventory.length === 0) return message.reply("**Koleksi kamu kosong!**");

        const lastCard = data.inventory[data.inventory.length - 1];
        const embed = new EmbedBuilder()
            .setTitle(`**Koleksi ${message.author.username}**`)
            .setDescription(`**Total Koleksi: ${data.inventory.length} Kartu**\n**Terakhir didapat:** ${lastCard.category}`)
            .setImage(lastCard.url)
            .setColor("LuminousVividPink");

        message.reply({ embeds: [embed] });
    }
};