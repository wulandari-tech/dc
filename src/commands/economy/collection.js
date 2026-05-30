const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'collection',
    aliases: ['inv', 'inventory'],
    async execute(message) {
        const data = getUser(message.guild.id, message.author.id);
        const cards = data?.inventory || [];
        const items = data?.items || {};

        if (!cards.length && !Object.keys(items).length) {
            return message.reply('**Inventory kamu masih kosong.**');
        }

        const lastCard = cards[cards.length - 1];
        const categoryMap = new Map();
        for (const card of cards) {
            categoryMap.set(card.category, (categoryMap.get(card.category) || 0) + 1);
        }
        const topCategories = [...categoryMap.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0, 3)
            .map(([category, amount]) => `> ${category} x${amount}`)
            .join('\n') || '> belum ada kategori dominan';
        const itemLines = Object.entries(items)
            .slice(0, 8)
            .map(([name, amount]) => `> ${name} x${amount}`)
            .join('\n') || '> belum ada item';

        const embed = new EmbedBuilder()
            .setTitle(`Inventory ${message.author.username}`)
            .setDescription([
                `**Total Anime Card:** ${cards.length}`,
                `**Card Terakhir:** ${lastCard?.category || 'belum ada'}`,
                `**Artist Terakhir:** ${lastCard?.artist_name || 'belum ada'}`,
                '______________________________',
                topCategories,
                '______________________________',
                itemLines
            ].join('\n'))
            .setColor(0xec4899);

        if (lastCard?.url) embed.setImage(lastCard.url);

        return message.reply({ embeds: [embed] });
    }
};
