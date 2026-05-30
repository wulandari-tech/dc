const PROVIDERS = [
    {
        name: 'nekos.best',
        async fetch(category, userAgent) {
            const response = await fetch(`https://nekos.best/api/v2/${category}`, {
                headers: { 'User-Agent': userAgent }
            });
            const json = await response.json();
            const item = json.results?.[0];
            if (!item?.url) return null;
            return {
                provider: 'nekos.best',
                url: item.url,
                artist: item.artist_name || item.anime_name || 'Unknown',
                source: item.source_url || item.artist_href || null
            };
        }
    },
    {
        name: 'waifu.im',
        async fetch(category, userAgent) {
            const response = await fetch(`https://api.waifu.im/images?included_tags=${encodeURIComponent(category)}`, {
                headers: { 'User-Agent': userAgent }
            });
            const json = await response.json();
            const item = json.images?.[0] || json.items?.[0];
            if (!item?.url) return null;
            return {
                provider: 'waifu.im',
                url: item.url,
                artist: item.artist?.name || item.artist || item.signature || 'Unknown',
                source: item.source || null
            };
        }
    },
    {
        name: 'waifu.pics',
        async fetch(category, userAgent) {
            const response = await fetch(`https://api.waifu.pics/sfw/${category}`, {
                headers: { 'User-Agent': userAgent }
            });
            const json = await response.json();
            if (!json?.url) return null;
            return {
                provider: 'waifu.pics',
                url: json.url,
                artist: 'waifu.pics',
                source: null
            };
        }
    },
    {
        name: 'nekos.life',
        async fetch(category, userAgent) {
            const response = await fetch(`https://nekos.life/api/v2/img/${category}`, {
                headers: { 'User-Agent': userAgent }
            });
            const json = await response.json();
            if (!json?.url) return null;
            return {
                provider: 'nekos.life',
                url: json.url,
                artist: 'nekos.life',
                source: null
            };
        }
    },
    {
        name: 'nekos.moe',
        async fetch(category, userAgent) {
            const response = await fetch('https://nekos.moe/api/v1/random/image?nsfw=false&count=1', {
                headers: { 'User-Agent': userAgent }
            });
            const json = await response.json();
            const item = json.images?.[0];
            if (!item?.id) return null;
            return {
                provider: 'nekos.moe',
                url: `https://nekos.moe/image/${item.id}.jpg`,
                artist: item.artist || 'Unknown',
                source: null
            };
        }
    }
];

const CATEGORY_MAP = {
    waifu: 'waifu',
    neko: 'neko',
    kitsune: 'kitsune',
    husbando: 'husbando',
    maid: 'waifu',
    uniform: 'waifu',
    idol: 'waifu',
    samurai: 'waifu',
    foxgirl: 'kitsune',
    school: 'waifu',
    gamer: 'waifu',
    magical: 'waifu',
    cringe: 'cringe',
    baka: 'baka',
    pat: 'pat',
    wink: 'wink',
    smile: 'smile',
    highfive: 'highfive'
};

async function fetchAnimeCard(category, userAgent) {
    const mappedCategory = CATEGORY_MAP[category] || 'waifu';
    for (const provider of PROVIDERS) {
        try {
            const card = await provider.fetch(mappedCategory, userAgent);
            if (card?.url) return card;
        } catch {
            continue;
        }
    }

    return null;
}

module.exports = {
    PROVIDERS,
    fetchAnimeCard
};
