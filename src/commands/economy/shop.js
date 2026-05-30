const config = require('../../config.json');
const { ensureUser } = require('../../store/runtimeStore');

module.exports = {
    name: 'shop',
    async execute(message, args) {
        const categories = ['waifu', 'neko', 'kitsune', 'husbando'];
        const price = 1000;

        if (args[0] === 'buy') {
            const category = args[1]?.toLowerCase();
            if (!categories.includes(category)) {
                return message.reply('**Gunakan: .shop buy <waifu/neko/kitsune/husbando>**');
            }

            const data = ensureUser(message.guild.id, message.author.id);
            if (data.coins < price) {
                return message.reply('**Koin tidak cukup! Harga gacha: 1000 koin.**');
            }

            const response = await fetch(`https://nekos.best/api/v2/${category}`, {
                headers: { 'User-Agent': config.userAgent }
            });
            const result = await response.json();
            const card = result.results?.[0];

            if (!card?.url) {
                return message.reply('**Gagal mengambil kartu dari API. Coba lagi.**');
            }

            data.coins -= price;
            data.inventory.push({
                url: card.url,
                artist_name: card.artist_name || 'Original Work',
                category
            });

            return message.reply({
                content: `**Berhasil membeli Gacha ${category}!**\n**Artist:** ${card.artist_name || 'Unknown'}\n${card.url}`
            });
        }

        return message.reply('**ANIME CARD SHOP**\n**Harga Gacha: 💰 1000 Coins**\n**Kategori:** waifu, neko, kitsune, husbando\n\n**Ketik:** `.shop buy waifu`');
    }
};
