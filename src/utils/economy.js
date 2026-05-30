const { ensureUser, getUser } = require('../store/runtimeStore');

const SHOP_ITEMS = {
    role_voucher: { name: 'role_voucher', label: 'Role Voucher', price: 4000, kind: 'role', description: 'Voucher role spesial sementara.' },
    xp_boost: { name: 'xp_boost', label: 'XP Boost', price: 9000, kind: 'boost', description: 'Boost XP x2 selama 24 jam.' },
    ultra_xp_boost: { name: 'ultra_xp_boost', label: 'Ultra XP Boost', price: 18000, kind: 'boost', description: 'Boost XP x3 selama 24 jam.' },
    coin_boost: { name: 'coin_boost', label: 'Coin Boost', price: 12000, kind: 'boost', description: 'Boost coin x2 untuk hasil kerja dan game.' },
    ultra_coin_boost: { name: 'ultra_coin_boost', label: 'Ultra Coin Boost', price: 22000, kind: 'boost', description: 'Boost coin x3 untuk hasil kerja dan game.' },
    premium_badge: { name: 'premium_badge', label: 'Premium Badge', price: 5000, kind: 'badge', description: 'Badge profil premium.' },
    crimson_badge: { name: 'crimson_badge', label: 'Crimson Badge', price: 5500, kind: 'badge', description: 'Badge profil edisi crimson.' },
    neon_background: { name: 'neon_background', label: 'Neon Background', price: 4500, kind: 'background', description: 'Background profile card bernuansa neon.' },
    galaxy_background: { name: 'galaxy_background', label: 'Galaxy Background', price: 6000, kind: 'background', description: 'Background profile card galaksi.' },
    shadow_title: { name: 'shadow_title', label: 'Shadow Title', price: 3500, kind: 'title', description: 'Title profil premium.' },
    emperor_title: { name: 'emperor_title', label: 'Emperor Title', price: 6500, kind: 'title', description: 'Title profil eksklusif.' },
    fox_pet: { name: 'fox_pet', label: 'Fox Pet', price: 7000, kind: 'pet', description: 'Pet rubah untuk profile.' },
    dragon_pet: { name: 'dragon_pet', label: 'Dragon Pet', price: 12000, kind: 'pet', description: 'Pet naga premium.' },
    cat_pet: { name: 'cat_pet', label: 'Cat Pet', price: 6000, kind: 'pet', description: 'Pet kucing lucu untuk profile.' },
    hacker_pet: { name: 'hacker_pet', label: 'Hacker Pet', price: 45000, kind: 'pet', description: 'Pet termahal dengan skill membobol bank user lain.' },
    mystery_crate: { name: 'mystery_crate', label: 'Mystery Crate', price: 4200, kind: 'crate', description: 'Kotak acak berisi hadiah item atau coins.' },
    fishing_rod: { name: 'fishing_rod', label: 'Fishing Rod', price: 2500, kind: 'fish', description: 'Item khusus mini game fishing.' },
    bait_pack: { name: 'bait_pack', label: 'Bait Pack', price: 900, kind: 'fish', description: 'Umpan untuk aktivitas fishing.' },
    wheat_seeds: { name: 'wheat_seeds', label: 'Wheat Seeds', price: 800, kind: 'seeds', description: 'Bibit gandum untuk sistem farming.' },
    golden_seeds: { name: 'golden_seeds', label: 'Golden Seeds', price: 2200, kind: 'seeds', description: 'Bibit langka dengan hasil lebih tinggi.' },
    pet_food: { name: 'pet_food', label: 'Pet Food', price: 650, kind: 'petcare', description: 'Makanan pet untuk perawatan rutin.' },
    premium_pet_food: { name: 'premium_pet_food', label: 'Premium Pet Food', price: 1200, kind: 'petcare', description: 'Makanan premium untuk pet kesayangan.' },
    pet_soap: { name: 'pet_soap', label: 'Pet Soap', price: 800, kind: 'petcare', description: 'Sabun pet untuk menjaga kebersihan.' },
    pet_brush: { name: 'pet_brush', label: 'Pet Brush', price: 950, kind: 'petcare', description: 'Sikat bulu pet premium.' },
    bank_shield: { name: 'bank_shield', label: 'Bank Shield', price: 7500, kind: 'security', description: 'Melindungi bank dari satu percobaan heist.' },
    firewall_core: { name: 'firewall_core', label: 'Firewall Core', price: 12000, kind: 'security', description: 'Perlindungan bank premium dengan anti-heist.' }
};

const ANIME_CATEGORIES = [
    'waifu', 'neko', 'kitsune', 'husbando', 'maid', 'uniform', 'idol', 'samurai',
    'foxgirl', 'school', 'gamer', 'magical', 'cringe', 'baka', 'pat', 'wink', 'smile', 'highfive'
];

function formatCoins(value) {
    return new Intl.NumberFormat('id-ID').format(value);
}

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}j ${minutes}m ${seconds}d`;
}

function ensureFunds(guildId, userId, amount) {
    const user = getUser(guildId, userId);
    return Boolean(user && user.coins >= amount);
}

function getOrCreateUser(guildId, userId) {
    return ensureUser(guildId, userId);
}

function getActiveBoostMultiplier(user, boostType) {
    const now = Date.now();
    const boosts = (user.boosts || []).filter((boost) => boost.expiresAt > now);
    user.boosts = boosts;

    return boosts
        .filter((boost) => boost.type === boostType)
        .reduce((highest, boost) => Math.max(highest, boost.multiplier), 1);
}

module.exports = {
    SHOP_ITEMS,
    ANIME_CATEGORIES,
    formatCoins,
    formatDuration,
    ensureFunds,
    getOrCreateUser,
    getActiveBoostMultiplier
};
