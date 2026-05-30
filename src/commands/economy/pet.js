const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { ensureUser, removeItem, addItem } = require('../../store/runtimeStore');
const {
    PET_DEFS,
    ensurePetCollections,
    getActivePet,
    feedPet,
    cleanPet,
    playWithPet,
    petBattleRoll,
    buildPetBar,
    getXpNeeded,
    refreshPetImage,
    getPetPassive,
    getPetNetScore
} = require('../../utils/petSystem');

function listOwnedPets(user) {
    return Object.values(user.pets || {})
        .map((pet) => `> ${pet.key}${user.activePetId === pet.key ? ' (active)' : ''} - Lv.${pet.level} ${pet.badge} ${pet.stage}`)
        .join('\n') || '> belum ada pet';
}

async function buildPetEmbed(user, userName) {
    const activePet = getActivePet(user);
    const embed = new EmbedBuilder()
        .setColor(0xf472b6)
        .setTitle(`Pet Panel ${userName}`)
        .setDescription([
            activePet ? `**Active Pet:** ${activePet.badge} ${activePet.stage}` : '**Active Pet:** belum ada',
            '______________________________',
            listOwnedPets(user)
        ].join('\n'));

    if (!activePet) return embed;

    await refreshPetImage(activePet, config.userAgent);

    const definition = PET_DEFS[activePet.key];
    const passive = getPetPassive(user, definition.passive.context);

    embed.addFields(
        { name: 'Rarity', value: definition.rarity, inline: true },
        { name: 'Passive', value: passive.label, inline: true },
        { name: 'Level', value: `${activePet.level}`, inline: true },
        { name: 'XP', value: `${activePet.xp} / ${getXpNeeded(activePet.level)}`, inline: true },
        { name: 'Battle', value: `W ${activePet.wins || 0} / L ${activePet.losses || 0}`, inline: true },
        { name: 'Hack Meter', value: `${user.criminal?.hackMeter || 0}%`, inline: true },
        { name: 'Wanted Level', value: `${user.criminal?.wantedLevel || 0}`, inline: true },
        { name: 'Hunger', value: `${buildPetBar(activePet.hunger)} ${activePet.hunger}%`, inline: false },
        { name: 'Clean', value: `${buildPetBar(activePet.hygiene)} ${activePet.hygiene}%`, inline: false },
        { name: 'Mood', value: `${buildPetBar(activePet.mood)} ${activePet.mood}%`, inline: false },
        { name: 'Pet Items', value: `food ${user.items.pet_food || 0} | premium ${user.items.premium_pet_food || 0} | soap ${user.items.pet_soap || 0} | brush ${user.items.pet_brush || 0}`, inline: false },
        { name: 'Security', value: `shield ${user.items.bank_shield || 0} | firewall ${user.items.firewall_core || 0}`, inline: false }
    );

    if (activePet.imageUrl) embed.setImage(activePet.imageUrl);
    return embed;
}

module.exports = {
    name: 'pet',
    async execute(message, args) {
        const user = ensureUser(message.guild.id, message.author.id);
        ensurePetCollections(user);
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'info') {
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'inventory' || sub === 'list') {
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'leaderboard') {
            const members = [...message.guild.members.cache.values()]
                .map((member) => ({ member, user: ensureUser(message.guild.id, member.id) }))
                .filter((entry) => Object.keys(entry.user.pets || {}).length > 0)
                .map((entry) => {
                    const active = getActivePet(entry.user);
                    return {
                        username: entry.member.user.username,
                        score: active ? getPetNetScore(active) : 0,
                        pet: active
                    };
                })
                .sort((left, right) => right.score - left.score)
                .slice(0, 10);

            if (!members.length) return message.reply('**Belum ada pet leaderboard.**');
            return message.reply(members.map((entry, index) => `> #${index + 1} ${entry.username} - ${entry.pet.badge} ${entry.pet.stage} - score ${entry.score}`).join('\n'));
        }

        if (sub === 'equip') {
            const petKey = args[1]?.toLowerCase();
            if (!petKey || !user.pets[petKey]) return message.reply('**Pet tidak ditemukan di pet inventory.**');
            user.activePetId = petKey;
            user.profile.pet = petKey;
            return message.reply(`**Pet aktif diganti ke** ${PET_DEFS[petKey]?.label || petKey}.`);
        }

        const activePet = getActivePet(user);
        if (!activePet) {
            return message.reply('**Kamu belum punya pet aktif.**\n> Beli dulu di `.shop pet` lalu pakai `.pet equip <nama_pet>`');
        }

        if (sub === 'feed') {
            const premium = (user.items.premium_pet_food || 0) > 0;
            const normal = (user.items.pet_food || 0) > 0;
            if (!premium && !normal) return message.reply('**Kamu tidak punya makanan pet.**');
            if (premium) removeItem(message.guild.id, message.author.id, 'premium_pet_food', 1);
            else removeItem(message.guild.id, message.author.id, 'pet_food', 1);
            feedPet(activePet, premium);
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'clean') {
            const deluxe = (user.items.pet_brush || 0) > 0;
            const soap = (user.items.pet_soap || 0) > 0;
            if (!deluxe && !soap) return message.reply('**Kamu tidak punya item clean pet.**');
            if (deluxe) removeItem(message.guild.id, message.author.id, 'pet_brush', 1);
            else removeItem(message.guild.id, message.author.id, 'pet_soap', 1);
            cleanPet(activePet, deluxe);
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'play') {
            playWithPet(activePet);
            if (Math.random() < 0.35) addItem(message.guild.id, message.author.id, 'pet_food', 1);
            return message.reply({ embeds: [await buildPetEmbed(user, message.author.username)] });
        }

        if (sub === 'battle') {
            const targetUser = message.mentions.users.first();
            if (!targetUser || targetUser.id === message.author.id) {
                return message.reply('**Gunakan:** `.pet battle @user`');
            }
            const enemyUser = ensureUser(message.guild.id, targetUser.id);
            ensurePetCollections(enemyUser);
            const enemyPet = getActivePet(enemyUser);
            if (!enemyPet) return message.reply('**Lawan tidak punya pet aktif.**');

            const myRoll = petBattleRoll(activePet);
            const enemyRoll = petBattleRoll(enemyPet);

            if (myRoll === enemyRoll) {
                return message.reply(`**Pet battle seri.**\n> ${activePet.stage}: ${myRoll}\n> ${enemyPet.stage}: ${enemyRoll}`);
            }

            const iWin = myRoll > enemyRoll;
            if (iWin) {
                playWithPet(activePet);
                activePet.hunger = Math.max(0, activePet.hunger - 4);
                enemyPet.mood = Math.max(0, enemyPet.mood - 8);
                activePet.wins = (activePet.wins || 0) + 1;
                enemyPet.losses = (enemyPet.losses || 0) + 1;
                return message.reply(`**Pet battle menang.**\n> ${activePet.stage}: ${myRoll}\n> ${enemyPet.stage}: ${enemyRoll}`);
            }

            playWithPet(enemyPet);
            activePet.mood = Math.max(0, activePet.mood - 8);
            activePet.losses = (activePet.losses || 0) + 1;
            enemyPet.wins = (enemyPet.wins || 0) + 1;
            return message.reply(`**Pet battle kalah.**\n> ${activePet.stage}: ${myRoll}\n> ${enemyPet.stage}: ${enemyRoll}`);
        }

        return message.reply('**Gunakan:** `.pet`, `.pet info`, `.pet inventory`, `.pet leaderboard`, `.pet equip <pet>`, `.pet feed`, `.pet clean`, `.pet play`, `.pet battle @user`');
    }
};
