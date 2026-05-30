const duelStore = new Map();

function createDuelChallenge({ guildId, challengerId, opponentId, bet, challengerName, opponentName }) {
    const id = `${guildId}:${challengerId}:${opponentId}:${Date.now()}`;
    duelStore.set(id, {
        id,
        guildId,
        challengerId,
        opponentId,
        bet,
        challengerName,
        opponentName,
        createdAt: Date.now(),
        expiresAt: Date.now() + 120000
    });
    return duelStore.get(id);
}

function getDuelChallenge(id) {
    const duel = duelStore.get(id);
    if (!duel) return null;
    if (duel.expiresAt < Date.now()) {
        duelStore.delete(id);
        return null;
    }
    return duel;
}

function removeDuelChallenge(id) {
    const duel = duelStore.get(id) || null;
    duelStore.delete(id);
    return duel;
}

module.exports = {
    createDuelChallenge,
    getDuelChallenge,
    removeDuelChallenge
};
