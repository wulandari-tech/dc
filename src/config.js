const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const envPath = path.join(__dirname, '..', '.env');

let fileConfig = {};
try {
    fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch {
    fileConfig = {};
}

const fileEnv = {};
try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) continue;
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && !(key in fileEnv)) {
            fileEnv[key] = value;
        }
    }
} catch {
    // ignore missing local .env file
}

function readSecret(envKeys, fallback = '') {
    for (const key of envKeys) {
        const value = process.env[key] || fileEnv[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    return fallback;
}

module.exports = {
    token: readSecret(['DISCORD_TOKEN', 'TOKEN']),
    mongoURI: readSecret(['MONGO_URI', 'MONGODB_URI']),
    topggToken: readSecret(['TOPGG_TOKEN']),
    prefix: fileConfig.prefix || '.',
    welcomeChannel: fileConfig.welcomeChannel || '',
    logChannel: fileConfig.logChannel || '',
    verifyChannel: fileConfig.verifyChannel || '',
    memberRole: fileConfig.memberRole || '',
    ownerId: fileConfig.ownerId || '',
    emoji_1: fileConfig.emoji_1 || '',
    userAgent: fileConfig.userAgent || 'asisNewCoding/1.0'
};
