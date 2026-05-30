const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    inventory: [String]
});

module.exports = mongoose.model('User', UserSchema);