const { ensureUser, removeItem } = require('../../store/runtimeStore');

module.exports = {
    name: 'use',
    async execute(message, args) {
        const itemName = args[0]?.toLowerCase();
        if (!itemName) {
            return message.reply('**Gunakan:** `.use <item>`');
        }

        const data = ensureUser(message.guild.id, message.author.id);
        if (!data.items[itemName]) {
            return message.reply('**Item itu tidak ada di inventory kamu.**');
        }

        if (itemName.includes('badge')) {
            data.profile.badge = itemName;
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply(`**Badge aktif diperbarui ke** ${itemName}.`);
        }

        if (itemName.includes('background')) {
            data.profile.background = itemName;
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply(`**Background aktif diperbarui ke** ${itemName}.`);
        }

        if (itemName.includes('title')) {
            data.profile.title = itemName;
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply(`**Title aktif diperbarui ke** ${itemName}.`);
        }

        if (itemName.includes('pet')) {
            return message.reply('**Pet sekarang pakai sistem khusus.**\n> Gunakan `.pet equip <nama_pet>` untuk mengaktifkan pet.');
        }

        if (itemName === 'xp_boost') {
            data.boosts.push({ type: 'xp', multiplier: 2, expiresAt: Date.now() + 86400000 });
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply('**XP Boost aktif.**\n> Bonus XP x2 selama 24 jam');
        }

        if (itemName === 'ultra_xp_boost') {
            data.boosts.push({ type: 'xp', multiplier: 3, expiresAt: Date.now() + 86400000 });
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply('**Ultra XP Boost aktif.**\n> Bonus XP x3 selama 24 jam');
        }

        if (itemName === 'coin_boost') {
            data.boosts.push({ type: 'coin', multiplier: 2, expiresAt: Date.now() + 86400000 });
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply('**Coin Boost aktif.**\n> Bonus hasil economy/game x2 selama 24 jam');
        }

        if (itemName === 'ultra_coin_boost') {
            data.boosts.push({ type: 'coin', multiplier: 3, expiresAt: Date.now() + 86400000 });
            removeItem(message.guild.id, message.author.id, itemName, 1);
            return message.reply('**Ultra Coin Boost aktif.**\n> Bonus hasil economy/game x3 selama 24 jam');
        }

        if (itemName.includes('crate')) {
            removeItem(message.guild.id, message.author.id, itemName, 1);
            const reward = 1200 + Math.floor(Math.random() * 3001);
            data.coins += reward;
            return message.reply(`**Mystery crate dibuka.**\n> Reward: ${reward} coins`);
        }

        if (itemName === 'pet_food' || itemName === 'premium_pet_food' || itemName === 'pet_soap' || itemName === 'pet_brush') {
            return message.reply('**Item petcare sekarang dipakai lewat panel pet.**\n> Gunakan `.pet feed` atau `.pet clean`.');
        }

        return message.reply('**Item ini belum punya efek aktif khusus, tapi sudah tersimpan di inventory.**');
    }
};
