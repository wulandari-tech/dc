const User = require('../../models/User');
const config = require('../../config.json');

module.exports = {
    name: 'shop',
    async execute(message, args) {
        const categories = ['waifu', 'neko', 'kitsune', 'husbando'];
        const price = 1000;

        if (args[0] === 'buy') {
            const cat = args[1]?.toLowerCase();
            if (!categories.includes(cat)) return message.reply(`**Gunakan: .shop buy <waifu/neko/kitsune/husbando>**`);

            let data = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
            if (!data || data.coins < price) return message.reply("**Koin tidak cukup! Harga gacha: 1000 koin.**");

            // Fetch dari nekos.best API
            const response = await fetch(`https://nekos.best/api/v2/${cat}`, {
                headers: { 'User-Agent': config.userAgent }
            });
            const result = await response.json();
            const card = result.results[0];

            data.coins -= price;
            data.inventory.push({
                url: card.url,
                artist_name: card.artist_name || 'Original Work',
                category: cat
            });
            await data.save();

            return message.reply({
                content: `**Berhasil membeli Gacha ${cat}!**\n**Artist:** ${card.artist_name || 'Unknown'}\n${card.url}`
            });
        }

        message.reply(`**🏪 ANIME CARD SHOP**\n**Harga Gacha: 💰 1000 Coins**\n**Kategori:** waifu, neko, kitsune, husbando\n\n**Ketik:** \`.shop buy waifu\``);
    }
};