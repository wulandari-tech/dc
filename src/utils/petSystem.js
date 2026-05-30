const { fetchAnimeCard } = require('./animeProviders');

const PET_DEFS = {
    cat_pet: {
        key: 'cat_pet',
        label: 'Cat Pet',
        species: 'cat',
        rarity: 'Rare',
        imageTag: 'neko',
        passive: { context: 'beg_daily', coinMultiplier: 1.18, xpMultiplier: 1.04, label: 'Daily and Beg bonus' },
        evolutions: [
            { level: 1, stage: 'Street Cat', badge: '🐾' },
            { level: 5, stage: 'Velvet Cat', badge: '🎀' },
            { level: 10, stage: 'Royal Neko', badge: '💠' }
        ]
    },
    fox_pet: {
        key: 'fox_pet',
        label: 'Fox Pet',
        species: 'fox',
        rarity: 'Epic',
        imageTag: 'kitsune',
        passive: { context: 'work', coinMultiplier: 1.2, xpMultiplier: 1.05, label: 'Work bonus' },
        evolutions: [
            { level: 1, stage: 'Cub Fox', badge: '🦊' },
            { level: 5, stage: 'Mystic Fox', badge: '✨' },
            { level: 10, stage: 'Celestial Kitsune', badge: '🌙' }
        ]
    },
    dragon_pet: {
        key: 'dragon_pet',
        label: 'Dragon Pet',
        species: 'dragon',
        rarity: 'Legendary',
        imageTag: 'magical',
        passive: { context: 'crime_duel', coinMultiplier: 1.25, xpMultiplier: 1.08, label: 'Crime and Duel bonus' },
        evolutions: [
            { level: 1, stage: 'Dragon Hatchling', badge: '🐉' },
            { level: 4, stage: 'Inferno Drake', badge: '🔥' },
            { level: 9, stage: 'Ancient Dragon', badge: '👑' }
        ]
    },
    hacker_pet: {
        key: 'hacker_pet',
        label: 'Hacker Pet',
        species: 'cyber',
        rarity: 'Mythic',
        imageTag: 'gamer',
        passive: { context: 'bank_heist', coinMultiplier: 1.35, xpMultiplier: 1.12, label: 'Bank heist infiltration bonus' },
        evolutions: [
            { level: 1, stage: 'Script Kitten', badge: '💻' },
            { level: 6, stage: 'Cipher Phantom', badge: '🧠' },
            { level: 12, stage: 'Zero-Day Sovereign', badge: '🕶️' }
        ]
    }
};

function defaultPetState(petKey, imageUrl = null) {
    return {
        key: petKey,
        hunger: 86,
        hygiene: 82,
        mood: 84,
        level: 1,
        xp: 0,
        stage: PET_DEFS[petKey]?.evolutions?.[0]?.stage || 'Companion',
        badge: PET_DEFS[petKey]?.evolutions?.[0]?.badge || '🐾',
        imageUrl,
        inventory: {
            pet_food: 0,
            premium_pet_food: 0,
            pet_soap: 0,
            pet_brush: 0
        },
        wins: 0,
        losses: 0,
        lastDecayAt: Date.now(),
        lastPlayedAt: null
    };
}

function ensurePetCollections(user) {
    if (!user.pets) user.pets = {};
    if (!user.activePetId) user.activePetId = user.profile?.pet || null;
    if (!user.petStorage) user.petStorage = {};
}

function clampStat(value) {
    return Math.max(0, Math.min(100, value));
}

function applyPetDecay(user) {
    ensurePetCollections(user);
    const now = Date.now();

    for (const pet of Object.values(user.pets)) {
        if (!pet.lastDecayAt) pet.lastDecayAt = now;
        const elapsedDays = Math.floor((now - pet.lastDecayAt) / 86400000);
        if (elapsedDays <= 0) continue;

        pet.hunger = clampStat(pet.hunger - (elapsedDays * 14));
        pet.hygiene = clampStat(pet.hygiene - (elapsedDays * 10));
        pet.mood = clampStat(pet.mood - (elapsedDays * 9));
        pet.lastDecayAt += elapsedDays * 86400000;
    }
}

function getXpNeeded(level) {
    return Math.max(120, level * 140);
}

function syncEvolution(pet) {
    const definition = PET_DEFS[pet.key];
    if (!definition) return pet;
    const evo = [...definition.evolutions].reverse().find((entry) => pet.level >= entry.level) || definition.evolutions[0];
    pet.stage = evo.stage;
    pet.badge = evo.badge;
    return pet;
}

function addPetXp(pet, amount) {
    pet.xp += amount;
    while (pet.xp >= getXpNeeded(pet.level)) {
        pet.xp -= getXpNeeded(pet.level);
        pet.level += 1;
    }
    syncEvolution(pet);
    return pet;
}

async function addOwnedPet(user, petKey, userAgent) {
    ensurePetCollections(user);
    applyPetDecay(user);
    if (user.pets[petKey]) return user.pets[petKey];

    let imageUrl = null;
    try {
        const image = await fetchAnimeCard(PET_DEFS[petKey]?.imageTag || 'waifu', userAgent);
        imageUrl = image?.url || null;
    } catch {
        imageUrl = null;
    }

    user.pets[petKey] = defaultPetState(petKey, imageUrl);
    if (!user.activePetId) {
        user.activePetId = petKey;
        if (user.profile) user.profile.pet = petKey;
    }
    return user.pets[petKey];
}

async function refreshPetImage(pet, userAgent) {
    const definition = PET_DEFS[pet.key];
    if (!definition) return pet;
    if (pet.imageUrl) return pet;
    try {
        const image = await fetchAnimeCard(definition.imageTag || 'waifu', userAgent);
        pet.imageUrl = image?.url || pet.imageUrl || null;
    } catch {
        pet.imageUrl = pet.imageUrl || null;
    }
    return pet;
}

function getActivePet(user) {
    ensurePetCollections(user);
    applyPetDecay(user);
    return user.activePetId ? user.pets[user.activePetId] || null : null;
}

function getPetPassive(user, context) {
    const pet = getActivePet(user);
    if (!pet) return { coinMultiplier: 1, xpMultiplier: 1, pet: null, label: 'No pet passive' };
    const definition = PET_DEFS[pet.key];
    if (!definition) return { coinMultiplier: 1, xpMultiplier: 1, pet, label: 'No pet passive' };

    const passive = definition.passive;
    const matches =
        passive.context === context ||
        (passive.context === 'crime_duel' && (context === 'crime' || context === 'duel')) ||
        (passive.context === 'beg_daily' && (context === 'beg' || context === 'daily' || context === 'weekly')) ||
        (passive.context === 'bank_heist' && (context === 'bank_heist' || context === 'rob'));

    const moodScale = 0.7 + (pet.mood / 100) * 0.3;
    const xpMultiplier = 1 + ((passive.xpMultiplier - 1) * moodScale);
    if (!matches) return { coinMultiplier: 1, xpMultiplier, pet, label: passive.label };

    return {
        coinMultiplier: 1 + ((passive.coinMultiplier - 1) * moodScale),
        xpMultiplier,
        pet,
        label: passive.label
    };
}

function feedPet(pet, premium = false) {
    pet.hunger = clampStat(pet.hunger + (premium ? 34 : 22));
    pet.mood = clampStat(pet.mood + (premium ? 16 : 8));
    addPetXp(pet, premium ? 55 : 25);
    return pet;
}

function cleanPet(pet, deluxe = false) {
    pet.hygiene = clampStat(pet.hygiene + (deluxe ? 30 : 20));
    pet.mood = clampStat(pet.mood + (deluxe ? 12 : 6));
    addPetXp(pet, deluxe ? 40 : 20);
    return pet;
}

function playWithPet(pet) {
    pet.mood = clampStat(pet.mood + 24);
    pet.hunger = clampStat(pet.hunger - 6);
    addPetXp(pet, 45);
    pet.lastPlayedAt = Date.now();
    return pet;
}

function petBattleRoll(pet) {
    const base = pet.level * 15;
    return base + pet.hunger + pet.hygiene + pet.mood + Math.floor(Math.random() * 70);
}

function buildPetBar(value) {
    const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function getPetNetScore(pet) {
    return (pet.level * 1000) + pet.xp + (pet.wins * 30) - (pet.losses * 12);
}

module.exports = {
    PET_DEFS,
    ensurePetCollections,
    applyPetDecay,
    addOwnedPet,
    refreshPetImage,
    getActivePet,
    getPetPassive,
    feedPet,
    cleanPet,
    playWithPet,
    petBattleRoll,
    buildPetBar,
    getXpNeeded,
    addPetXp,
    syncEvolution,
    getPetNetScore
};
