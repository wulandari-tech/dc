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
        lastDaily: null,
        inventory: []
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
        isLockdown: false
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

function getLeaderboard(guildId, limit = 10) {
    return [...userStore.values()]
        .filter((user) => user.guildId === guildId)
        .sort((left, right) => {
            if (right.level !== left.level) {
                return right.level - left.level;
            }
            return right.xp - left.xp;
        })
        .slice(0, limit);
}

module.exports = {
    getUser,
    ensureUser,
    updateUser,
    getGuild,
    ensureGuild,
    updateGuild,
    getLeaderboard
};
