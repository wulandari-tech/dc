const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    welcomeChannel: { type: String, default: null },
    logChannel: { type: String, default: null },
    verifyChannel: { type: String, default: null },
    memberRole: { type: String, default: null },
    badWords: { type: Array, default: [] },
    isLockdown: { type: Boolean, default: false }
});

module.exports = mongoose.model('Guild', GuildSchema);