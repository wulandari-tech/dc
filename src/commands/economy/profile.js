const { EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');
const { getActivePet, ensurePetCollections, refreshPetImage } = require('../../utils/petSystem');

function createBar(current, total) {
    const safeTotal = Math.max(total, 1);
    const progress = Math.max(0, Math.min(10, Math.round((10 * current) / safeTotal)));
    return '█'.repeat(progress) + '░'.repeat(10 - progress);
}

module.exports = {
    name: 'profile',
    async execute(message) {
        const target = message.mentions.users.first() || message.author;
        const data = ensureUser(message.guild.id, target.id);
        ensurePetCollections(data);
        const activePet = getActivePet(data);
        const xpNeeded = Math.max(800, data.level * 800);
        const boostsActive = (data.boosts || []).filter((boost) => boost.expiresAt > Date.now()).length;

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setAuthor({ name: `Profile ${target.username}`, iconURL: target.displayAvatarURL() })
            .setDescription([
                `**Title:** ${data.profile.title || 'Rookie Adventurer'}`,
                `**Badge:** ${data.profile.badge || 'Starter Emblem'}`,
                `**Background:** ${data.profile.background || 'Midnight Frame'}`,
                `**Pet:** ${activePet ? `${activePet.badge} ${activePet.stage}` : 'Belum ada pet aktif'}`,
                `**Boost Aktif:** ${boostsActive}`
            ].join('\n'))
            .addFields(
                { name: 'Cash', value: `${formatCoins(data.coins)} coins`, inline: true },
                { name: 'Bank', value: `${formatCoins(data.bank)} coins`, inline: true },
                { name: 'Net Worth', value: `${formatCoins(data.coins + data.bank)} coins`, inline: true },
                { name: 'Level', value: `${data.level}`, inline: true },
                { name: 'XP', value: `${data.xp} / ${xpNeeded}`, inline: true },
                { name: 'Progress', value: `${createBar(data.xp, xpNeeded)}`, inline: false },
                { name: 'Collection', value: `${data.inventory.length} card`, inline: true },
                { name: 'Items', value: `${Object.keys(data.items || {}).length} jenis`, inline: true }
            );

        if (activePet) {
            await refreshPetImage(activePet, require('../../config.json').userAgent);
            if (activePet.imageUrl) embed.setThumbnail(activePet.imageUrl);
        }

        return message.reply({ embeds: [embed] });
    }
};
