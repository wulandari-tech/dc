const { AutoPoster } = require('topgg-autoposter');
const config = require('../config.json');

module.exports = (client) => {
    if (config.topggToken) {
        const ap = AutoPoster(config.topggToken, client);
        ap.on('posted', () => console.log('✅ Stats posted to Top.gg'));
    }
};