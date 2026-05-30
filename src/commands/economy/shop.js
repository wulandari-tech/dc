const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { ensureUser, addItem } = require('../../store/runtimeStore');
const { SHOP_ITEMS, ANIME_CATEGORIES, formatCoins } = require('../../utils/economy');
const { fetchAnimeCard, PROVIDERS } = require('../../utils/animeProviders');
const { addOwnedPet } = require('../../utils/petSystem');

function buildMainShopEmbed() {
    const items = Object.values(SHOP_ITEMS)
        .slice(0, 8)
        .map((item) => `> ${item.name} - ${formatCoins(item.price)} coins`)
        .join('\n');

    return new EmbedBuilder()
        .setColor(0xf97316)
        .setTitle('Premium Shop')
        .setDescription([
            '______________________________',
            '**Submenu**',
            '> `.shop anime`',
            '> `.shop role`',
            '> `.shop boost`',
            '> `.shop badge`',
            '> `.shop crate`',
            '> `.shop background`',
            '> `.shop title`',
            '> `.shop pet`',
            '> `.shop petcare`',
            '> `.shop security`',
            '> `.shop fish`',
            '> `.shop seeds`',
            '> `.shop preview <item>`',
            '> `.shop buy <item>`',
            '> `.shop sell <item>`',
            '______________________________',
            items
        ].join('\n'));
}

function buildCategoryEmbed(title, filterKind) {
    const items = Object.values(SHOP_ITEMS)
        .filter((item) => item.kind === filterKind)
        .map((item) => `> ${item.name} - ${formatCoins(item.price)} coins\n> ${item.description}`)
        .join('\n');

    return new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle(title)
        .setDescription(items || '> belum ada item');
}

module.exports = {
    name: 'shop',
    async execute(message, args) {
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            return message.reply({ embeds: [buildMainShopEmbed()] });
        }

        if (sub === 'anime') {
            return message.reply(`**Anime Premium Categories**\n> ${ANIME_CATEGORIES.join(', ')}`);
        }

        if (['role', 'boost', 'badge', 'crate', 'background', 'title', 'pet', 'petcare', 'security', 'fish', 'seeds'].includes(sub)) {
            return message.reply({ embeds: [buildCategoryEmbed(`${sub.toUpperCase()} SHOP`, sub)] });
        }

        if (sub === 'preview') {
            const itemName = args[1]?.toLowerCase();
            const item = SHOP_ITEMS[itemName];
            if (!item) return message.reply('**Item tidak ditemukan untuk preview.**');
            return message.reply(`**Preview ${item.label}**\n> Harga: ${formatCoins(item.price)} coins\n> ${item.description}`);
        }

        if (sub === 'sell') {
            const itemName = args[1]?.toLowerCase();
            const data = ensureUser(message.guild.id, message.author.id);
            if (!itemName || !data.items[itemName]) return message.reply('**Item tidak ada di inventory.**');
            const item = SHOP_ITEMS[itemName];
            const sellPrice = item ? Math.floor(item.price * 0.6) : 500;
            data.items[itemName] -= 1;
            if (data.items[itemName] <= 0) delete data.items[itemName];
            data.coins += sellPrice;
            return message.reply(`**Item terjual.**\n> ${itemName} -> ${formatCoins(sellPrice)} coins`);
        }

        if (sub !== 'buy') {
            return message.reply({ embeds: [buildMainShopEmbed()] });
        }

        const itemName = args[1]?.toLowerCase();
        const data = ensureUser(message.guild.id, message.author.id);

        if (ANIME_CATEGORIES.includes(itemName)) {
            const price = 1000;
            if (data.coins < price) {
                return message.reply(`**Coins tidak cukup.**\n> Harga anime gacha: ${formatCoins(price)} coins`);
            }

            const card = await fetchAnimeCard(itemName, config.userAgent);
            if (!card?.url) return message.reply('**Data anime card tidak tersedia dari semua provider.**');

            data.coins -= price;
            data.inventory.push({
                url: card.url,
                artist_name: card.artist || 'Unknown Artist',
                category: itemName
            });

            const embed = new EmbedBuilder()
                .setColor(0xec4899)
                .setTitle(`Anime card ${itemName.toUpperCase()} diperoleh`)
                .setDescription(`**Artist:** ${card.artist || 'Unknown Artist'}\n**Provider:** ${card.provider}\n**Sumber aktif:** ${PROVIDERS.length} provider\n**Sisa Coins:** ${formatCoins(data.coins)}`)
                .setImage(card.url);

            return message.reply({ embeds: [embed] });
        }

        const item = SHOP_ITEMS[itemName];
        if (!item) return message.reply('**Item shop tidak ditemukan.**');
        if (data.coins < item.price) return message.reply('**Coins kamu tidak cukup untuk membeli item itu.**');

        data.coins -= item.price;

        let bonusText = '';
        if (item.kind === 'pet') {
            await addOwnedPet(data, item.name, config.userAgent);
            addItem(message.guild.id, message.author.id, 'pet_food', 1);
            addItem(message.guild.id, message.author.id, 'pet_soap', 1);
            bonusText = '\n> Bonus gift: pet_food x1, pet_soap x1\n> Pet masuk ke pet inventory dan bisa dipakai lewat `.pet equip`';
        } else {
            addItem(message.guild.id, message.author.id, item.name, 1);
        }

        return message.reply(`**Pembelian berhasil.**\n> Item: ${item.label}\n> Harga: ${formatCoins(item.price)} coins${bonusText}`);
    }
};
