const guildStore = new Map();
const userStore = new Map();

function buildUserKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function getDefaultUser(guildId, userId) {
    return {
        guildId,
        userId,
        xp: 0,
        level: 1,
        coins: 0,
        bank: 0,
        lastDaily: null,
        lastWeekly: null,
        lastWork: null,
        lastBeg: null,
        lastCrime: null,
        lastRob: null,
        lastBankHeist: null,
        inventory: [],
        items: {},
        boosts: [],
        pets: {},
        activePetId: null,
        petStorage: {},
        profile: {
            badge: null,
            background: null,
            title: null,
            pet: null
        },
        criminal: {
            wantedLevel: 0,
            hackMeter: 0
        }
    };
}

function getDefaultGuild(guildId, defaults = {}) {
    return {
        guildId,
        welcomeChannel: defaults.welcomeChannel || null,
        logChannel: defaults.logChannel || null,
        verifyChannel: defaults.verifyChannel || null,
        memberRole: defaults.memberRole || null,
        badWords: [],
        isLockdown: false,
        warnings: {}
    };
}

function getUser(guildId, userId) {
    return userStore.get(buildUserKey(guildId, userId)) || null;
}

function ensureUser(guildId, userId) {
    const key = buildUserKey(guildId, userId);
    if (!userStore.has(key)) {
        userStore.set(key, getDefaultUser(guildId, userId));
    }
    return userStore.get(key);
}

function updateUser(guildId, userId, updater) {
    const user = ensureUser(guildId, userId);
    updater(user);
    return user;
}

function getGuild(guildId) {
    return guildStore.get(guildId) || null;
}

function ensureGuild(guildId, defaults) {
    if (!guildStore.has(guildId)) {
        guildStore.set(guildId, getDefaultGuild(guildId, defaults));
    }
    return guildStore.get(guildId);
}

function updateGuild(guildId, updater, defaults) {
    const guild = ensureGuild(guildId, defaults);
    updater(guild);
    return guild;
}

function getLeaderboard(guildId, limit = 10, metric = 'level') {
    const users = [...userStore.values()].filter((user) => user.guildId === guildId);

    if (metric === 'coins') {
        return users
            .sort((left, right) => {
                const leftTotal = left.coins + left.bank;
                const rightTotal = right.coins + right.bank;
                return rightTotal - leftTotal;
            })
            .slice(0, limit);
    }

    return users
        .sort((left, right) => {
            if (right.level !== left.level) {
                return right.level - left.level;
            }
            return right.xp - left.xp;
        })
        .slice(0, limit);
}

function addItem(guildId, userId, itemName, amount = 1) {
    const user = ensureUser(guildId, userId);
    user.items[itemName] = (user.items[itemName] || 0) + amount;
    return user;
}

function removeItem(guildId, userId, itemName, amount = 1) {
    const user = ensureUser(guildId, userId);
    const current = user.items[itemName] || 0;
    if (current < amount) return false;

    const next = current - amount;
    if (next <= 0) delete user.items[itemName];
    else user.items[itemName] = next;

    return true;
}

function getWarnings(guildId, userId) {
    const guild = ensureGuild(guildId);
    return guild.warnings[userId] || [];
}

function addWarning(guildId, userId, reason, moderatorId) {
    const guild = ensureGuild(guildId);
    if (!guild.warnings[userId]) guild.warnings[userId] = [];
    guild.warnings[userId].push({
        reason,
        moderatorId,
        createdAt: Date.now()
    });
    return guild.warnings[userId];
}

function removeWarning(guildId, userId) {
    const guild = ensureGuild(guildId);
    if (!guild.warnings[userId]?.length) return [];
    guild.warnings[userId].pop();
    if (!guild.warnings[userId].length) delete guild.warnings[userId];
    return guild.warnings[userId] || [];
}

module.exports = {
    getUser,
    ensureUser,
    updateUser,
    getGuild,
    ensureGuild,
    updateGuild,
    getLeaderboard,
    addItem,
    removeItem,
    getWarnings,
    addWarning,
    removeWarning
};
