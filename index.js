const {
    Client,
    GatewayIntentBits,
    Collection,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const config = require('./src/config');
const { ensureGuild, ensureUser, updateUser } = require('./src/store/runtimeStore');
const { getActiveBoostMultiplier } = require('./src/utils/economy');
const { getDuelChallenge, removeDuelChallenge } = require('./src/store/duelStore');
const { getPetPassive } = require('./src/utils/petSystem');

const discordToken = config.token;
let botStatus = {
    state: 'booting',
    detail: 'Memulai container',
    readyAt: null
};

const app = express();
app.get('/', (req, res) => {
    res.json({
        service: 'asis-newcoding',
        web: 'online',
        discord: botStatus
    });
});
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

const DASHBOARD_SECTIONS = {
    home: {
        title: 'DASHBOARD',
        badge: 'SYSTEM READY',
        summary: 'Sistem berhasil dimuat. Pilih kategori menu untuk membuka daftar perintah yang lebih detail.',
        sections: [
            { label: 'MODERATION', description: 'Kelola channel, role, dan pengaturan server.' },
            { label: 'ECONOMY', description: 'Atur saldo, klaim harian, toko, dan transfer.' },
            { label: 'LEVELING', description: 'Pantau rank dan papan peringkat member.' },
            { label: 'GAMES', description: 'Mainkan command game ringan langsung dari chat.' },
            { label: 'UTILITY', description: 'Buka panel utama dan alat bantu inti bot.' }
        ]
    },
    mod: {
        title: 'MODERATION',
        badge: 'CONTROL CENTER',
        summary: 'Panel admin untuk mengatur welcome, log, verifikasi, dan role member.',
        commands: ['.mod', '.mod kick @user [alasan]', '.mod ban @user [alasan]', '.mod unban <userId>', '.mod timeout @user <menit> [alasan]', '.mod untimeout @user', '.mod clear <jumlah>', '.mod nick @user <nama>', '.mod warn @user [alasan]', '.mod warnings @user', '.mod role add @user @role', '.mod role remove @user @role', '.mod lock', '.mod unlock', '.mod slowmode <detik>', '.mod announce <teks>', '.mod hide #channel', '.mod unhide #channel', '.setup welcome #channel', '.setup log #channel', '.setup verify #channel', '.setup role @role']
    },
    eco: {
        title: 'ECONOMY',
        badge: 'ECONOMY SUITE',
        summary: 'Gunakan menu ini untuk melihat saldo, klaim hadiah, belanja, dan transfer.',
        commands: ['.bal', '.daily', '.weekly', '.work', '.beg', '.crime', '.rob @user', '.transfer @user <jumlah>', '.bank', '.bank deposit <jumlah>', '.bank withdraw <jumlah>', '.bank heist @user', '.withdraw <jumlah>', '.leaderboard coins', '.leaderboard level', '.profile', '.inventory', '.pet', '.pet info', '.pet inventory', '.pet leaderboard', '.pet equip <pet>', '.pet feed', '.pet clean', '.pet play', '.pet battle @user', '.use <item>', '.shop', '.shop buy <item>', '.givecoins @user <jumlah>', '.takecoins @user <jumlah>', '.setcoins @user <jumlah>']
    },
    lev: {
        title: 'LEVELING',
        badge: 'PROGRESSION',
        summary: 'Pantau progres XP, rank member, dan papan peringkat server.',
        commands: ['.rank', '.leaderboard']
    },
    gam: {
        title: 'GAMES',
        badge: 'FUN ZONE',
        summary: 'Kategori game interaktif untuk taruhan koin, duel cepat, dan mini game harian.',
        commands: ['.dice <bet>', '.coinflip <bet> <heads/tails>', '.slots <bet>', '.rps <rock/paper/scissors> <bet>', '.blackjack <bet>', '.guess <bet> <angka>', '.tower <bet>', '.crash <bet>', '.wheel <bet>', '.wheel free', '.wheel daily', '.wheel weekly', '.duel @user <bet>']
    },
    utl: {
        title: 'UTILITY',
        badge: 'TOOLS',
        summary: 'Akses utilitas inti untuk membuka panel utama bot.',
        commands: ['.start']
    }
};

const PREMIUM_ROLE = {
    id: '1510177731994849391',
    name: 'Premium',
    color: 0xf5b942
};

const PREMIUM_BENEFITS = [
    'Anggota timeout untuk kontrol percakapan yang lebih tertata.',
    'Kelola peran untuk membantu pengaturan member sesuai kebutuhan server.',
    'Ubah nama panggilan agar moderasi identitas lebih cepat.',
    'Izin saluran teks untuk kirim pesan dan buat postingan.',
    'Kirim pesan dalam thread dan postingan tanpa batasan dasar.',
    'Lampirkan file langsung di channel yang mendukung upload.',
    'Gunakan emoji dan sticker external lintas server.',
    'Sebut semua peran dan semua anggota saat dibutuhkan.'
];

client.commands = new Collection();
const xpCooldown = new Set();
const msgLog = new Map();
let joinVelocity = [];
const customEmoji = '<:emoji_1:1510146476150358137>';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
    const files = fs.readdirSync(`./src/commands/${folder}`).filter((file) => file.endsWith('.js'));
    for (const file of files) {
        const command = require(`./src/commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

function getGuildSettings(guildId) {
    return ensureGuild(guildId, {
        welcomeChannel: config.welcomeChannel,
        logChannel: config.logChannel,
        verifyChannel: config.verifyChannel,
        memberRole: config.memberRole
    });
}

function createBar(current, total) {
    const progress = total > 0 ? Math.round((10 * current) / total) : 0;
    return '#'.repeat(progress) + '-'.repeat(10 - progress);
}

function formatCommandList(commands) {
    return commands.map((command, index) => `> ${String(index + 1).padStart(2, '0')}. ${command}`).join('\n');
}

function buildOverviewBlock() {
    return DASHBOARD_SECTIONS.home.sections
        .map((section) => `**${section.label}**\n${section.description}`)
        .join('\n\n');
}

function buildDashboardEmbed(sectionKey) {
    const section = DASHBOARD_SECTIONS[sectionKey] || DASHBOARD_SECTIONS.home;
    const isHome = sectionKey === 'home';
    const embed = new EmbedBuilder()
        .setColor(isHome ? 0x1f2937 : 0x111827)
        .setTitle(`${customEmoji} ${section.title}`)
        .setDescription([
            '______________________________',
            `**${section.badge}**`,
            section.summary,
            '______________________________'
        ].join('\n'))
        .setFooter({ text: '2026 WANZOFC CONTROL PANEL' })
        .setTimestamp();

    if (client.user) {
        embed.setThumbnail(client.user.displayAvatarURL());
    }

    if (isHome) {
        embed.addFields(
            { name: 'Menu Tersedia', value: buildOverviewBlock(), inline: false },
            { name: 'Navigasi', value: 'Gunakan tombol di bawah untuk membuka kategori satu per satu.', inline: false }
        );
        return embed;
    }

    embed.addFields(
        { name: 'Daftar Command', value: formatCommandList(section.commands), inline: false },
        { name: 'Akses Cepat', value: 'Klik tombol kategori lain untuk berpindah panel command.', inline: false }
    );

    return embed;
}

function buildDashboardRows(activeKey = 'home') {
    const makeButton = (key, label, style) => (
        new ButtonBuilder()
            .setCustomId(`dash:${key}`)
            .setLabel(label)
            .setStyle(activeKey === key ? ButtonStyle.Primary : style)
    );

    const row1 = new ActionRowBuilder().addComponents(
        makeButton('home', 'Home', ButtonStyle.Secondary),
        makeButton('mod', 'Moderation', ButtonStyle.Secondary),
        makeButton('eco', 'Economy', ButtonStyle.Secondary),
        makeButton('lev', 'Leveling', ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        makeButton('gam', 'Games', ButtonStyle.Secondary),
        makeButton('utl', 'Utility', ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('dash:close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
    );

    return [row1, row2];
}

function buildVerifyEmbed(member) {
    return new EmbedBuilder()
        .setColor(0x16a34a)
        .setTitle(`${customEmoji} Welcome NewCoding`)
        .setDescription([
            `Halo <@${member.id}>`,
            '',
            'Silakan klik tombol verifikasi di bawah ini untuk membuka akses server.',
            'Tombol ini hanya berlaku untuk user yang baru join.'
        ].join('\n'))
        .addFields(
            { name: 'Status', value: 'Menunggu verifikasi', inline: true },
            { name: 'Akses', value: 'Role member akan diberikan otomatis', inline: true }
        )
        .setFooter({ text: `User ID: ${member.id}` })
        .setTimestamp();
}

function buildPremiumBenefitsText() {
    return PREMIUM_BENEFITS
        .map((benefit, index) => `> ${String(index + 1).padStart(2, '0')}  ${benefit}`)
        .join('\n');
}

function buildVerifiedEmbed(userId, roleId) {
    return new EmbedBuilder()
        .setColor(PREMIUM_ROLE.color)
        .setTitle(`${customEmoji} Verifikasi Berhasil`)
        .setDescription([
            `**<@${userId}> sekarang sudah terverifikasi dan masuk ke role <@&${roleId}>.**`,
            '',
            '______________________________',
            '> Paket akses aktif',
            '> Premium permissions unlocked',
            '______________________________',
            '',
            buildPremiumBenefitsText(),
            '',
        ].join('\n'))
        .addFields(
            { name: 'Status', value: '` VERIFIED `', inline: true },
            { name: 'Role', value: `<@&${roleId}>`, inline: true },
            { name: 'Akses', value: '` PREMIUM `', inline: true }
        )
        .setFooter({ text: `Premium access granted to ${userId}` })
        .setTimestamp();
}

async function getRole(guild, name, color) {
    let role = guild.roles.cache.find((entry) => entry.name === name);
    if (!role) {
        role = await guild.roles.create({ name, color }).catch(() => null);
    }
    return role;
}

async function resolveMemberRole(guild) {
    const settings = getGuildSettings(guild.id);
    if (settings.memberRole && /^\d+$/.test(settings.memberRole)) {
        const roleById = guild.roles.cache.get(settings.memberRole) || await guild.roles.fetch(settings.memberRole).catch(() => null);
        if (roleById) return roleById;
    }
    const configuredRole = guild.roles.cache.get(PREMIUM_ROLE.id) || await guild.roles.fetch(PREMIUM_ROLE.id).catch(() => null);
    if (configuredRole) return configuredRole;
    return getRole(guild, PREMIUM_ROLE.name, PREMIUM_ROLE.color);
}

client.once('clientReady', async () => {
    for (const guild of client.guilds.cache.values()) {
        getGuildSettings(guild.id);
    }
    botStatus = {
        state: 'ready',
        detail: `${client.user.tag} connected`,
        readyAt: new Date().toISOString()
    };
    console.log(`[ready] ${client.user.tag} is ready with upgraded dashboard`);
});

client.on('guildCreate', async (guild) => {
    getGuildSettings(guild.id);
});

client.on('guildMemberAdd', async (member) => {
    const now = Date.now();
    joinVelocity.push(now);
    joinVelocity = joinVelocity.filter((time) => now - time < 10000);
    if (joinVelocity.length > 8) return member.kick('Anti-Raid');

    const settings = getGuildSettings(member.guild.id);
    const channel = member.guild.channels.cache.get(settings.welcomeChannel || config.welcomeChannel);

    if (!channel) return;

    const verifyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`verify:${member.id}`)
            .setLabel('VERIFIKASI')
            .setStyle(ButtonStyle.Success)
    );

    await channel.send({
        content: `**Welcome NewCoding <@${member.id}>, selamat datang di server kami!** ${config.emoji_1}`,
        embeds: [buildVerifyEmbed(member)],
        components: [verifyRow]
    }).catch(() => null);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    getGuildSettings(message.guild.id);

    if (message.content === `${config.prefix}start`) {
        await message.delete().catch(() => {});

        const stages = [
            { title: 'BOOTING CORE SYSTEM', bar: '##________ 20%' },
            { title: 'LOADING PROTECTION LAYER', bar: '#####_____ 50%' },
            { title: 'SYNCING COMMAND REGISTRY', bar: '########__ 80%' },
            { title: 'RENDERING DASHBOARD PANEL', bar: '########## 100%' }
        ];

        const renderStage = (stage) => [
            '______________________________',
            `**${stage.title}**`,
            `\`${stage.bar}\``,
            '______________________________'
        ].join('\n');

        let loadMsg = await message.channel.send(renderStage(stages[0]));
        for (let i = 1; i < stages.length; i += 1) {
            await sleep(700);
            await loadMsg.edit(renderStage(stages[i]));
        }
        await sleep(400);
        await loadMsg.delete().catch(() => {});

        return message.channel.send({
            embeds: [buildDashboardEmbed('home')],
            components: buildDashboardRows('home')
        });
    }

    const logs = msgLog.get(message.author.id) || [];
    logs.push(Date.now());
    msgLog.set(message.author.id, logs.filter((time) => Date.now() - time < 5000));
    if (logs.length > 5) return message.delete().catch(() => {});

    if (/(discord-nitro|free-nitro|discord\.gg|https?:\/\/)/i.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.delete().catch(() => {});
    }

    if (!xpCooldown.has(message.author.id)) {
        const data = updateUser(message.guild.id, message.author.id, (user) => {
            const xpBoost = getActiveBoostMultiplier(user, 'xp');
            const petPassive = getPetPassive(user, 'chat');
            user.xp += Math.floor(40 * xpBoost * petPassive.xpMultiplier);
        });
        const next = data.level * 800;
        if (data.xp >= next) {
            data.level += 1;
            data.xp = 0;
            const role = await getRole(message.guild, `Elite Level ${data.level}`, 'Gold');
            if (role) await message.member.roles.add(role).catch(() => {});
            await message.channel.send(`**LEVEL UP!** <@${message.author.id}> **Level ${data.level}**\n\`[ ${createBar(data.xp, next)} ]\``).catch(() => null);
        }
        xpCooldown.add(message.author.id);
        setTimeout(() => xpCooldown.delete(message.author.id), 60000);
    }

    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find((entry) => entry.aliases?.includes(commandName));

    if (!command) return;
    try {
        await command.execute(message, args, client);
    } catch (error) {
        await message.reply('**Terjadi error saat menjalankan command.**').catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('verify:')) {
        const targetUserId = interaction.customId.split(':')[1];
        if (interaction.user.id !== targetUserId) {
            return interaction.reply({
                content: 'Button verifikasi ini hanya bisa dipakai oleh user yang baru join.',
                ephemeral: true
            }).catch(() => {});
        }

        const role = await resolveMemberRole(interaction.guild);
        if (!role) {
            return interaction.reply({
                content: 'Role member tidak ditemukan. Jalankan `.setup role @role` terlebih dahulu.',
                ephemeral: true
            }).catch(() => {});
        }

        await interaction.member.roles.add(role).catch(() => {});

        await interaction.update({
            content: `**<@${interaction.user.id}> berhasil diverifikasi.**`,
            embeds: [buildVerifiedEmbed(interaction.user.id, role.id)],
            components: []
        }).catch(() => {});

        return;
    }

    if (
        interaction.customId.startsWith('duel_accept:') ||
        interaction.customId.startsWith('duel_decline:') ||
        interaction.customId.startsWith('duel_accept|') ||
        interaction.customId.startsWith('duel_decline|')
    ) {
        const delimiter = interaction.customId.includes('|') ? '|' : ':';
        const parts = interaction.customId.split(delimiter);
        const action = parts.shift();
        const duelId = parts.join(delimiter);
        const duel = getDuelChallenge(duelId);

        if (!duel) {
            return interaction.reply({
                content: 'Tantangan duel ini sudah kedaluwarsa atau tidak ditemukan.',
                ephemeral: true
            }).catch(() => {});
        }

        if (interaction.user.id !== duel.opponentId) {
            return interaction.reply({
                content: 'Hanya user yang ditantang yang bisa merespons duel ini.',
                ephemeral: true
            }).catch(() => {});
        }

        removeDuelChallenge(duelId);

        if (action === 'duel_decline') {
            return interaction.update({
                content: `**${duel.opponentName} menolak duel dari ${duel.challengerName}.**`,
                embeds: [],
                components: []
            }).catch(() => {});
        }

        const challenger = interaction.guild.members.cache.get(duel.challengerId) || await interaction.guild.members.fetch(duel.challengerId).catch(() => null);
        const opponent = interaction.guild.members.cache.get(duel.opponentId) || await interaction.guild.members.fetch(duel.opponentId).catch(() => null);
        if (!challenger || !opponent) {
            return interaction.update({
                content: '**Salah satu peserta duel tidak lagi tersedia di server.**',
                embeds: [],
                components: []
            }).catch(() => {});
        }

        const challengerData = ensureUser(interaction.guild.id, duel.challengerId);
        const opponentData = ensureUser(interaction.guild.id, duel.opponentId);

        if (challengerData.coins < duel.bet || opponentData.coins < duel.bet) {
            return interaction.update({
                content: '**Duel dibatalkan karena salah satu pihak tidak lagi punya coins yang cukup.**',
                embeds: [],
                components: []
            }).catch(() => {});
        }

        const challengerPassive = getPetPassive(challengerData, 'duel');
        const opponentPassive = getPetPassive(opponentData, 'duel');
        const challengerPower = 20 + Math.floor(Math.random() * 81) + Math.floor((challengerPassive.xpMultiplier - 1) * 40);
        const opponentPower = 20 + Math.floor(Math.random() * 81) + Math.floor((opponentPassive.xpMultiplier - 1) * 40);
        const challengerCrit = Math.random() < 0.18;
        const opponentCrit = Math.random() < 0.18;
        const finalChallenger = challengerPower + (challengerCrit ? 15 : 0);
        const finalOpponent = opponentPower + (opponentCrit ? 15 : 0);

        if (finalChallenger === finalOpponent) {
            return interaction.update({
                content: `**Duel seri setelah diterima.**\n> ${duel.challengerName}: ${finalChallenger}\n> ${duel.opponentName}: ${finalOpponent}`,
                embeds: [],
                components: []
            }).catch(() => {});
        }

        const challengerWins = finalChallenger > finalOpponent;
        const winnerName = challengerWins ? duel.challengerName : duel.opponentName;
        const winnerData = challengerWins ? challengerData : opponentData;
        const loserData = challengerWins ? opponentData : challengerData;

        const winnerPassive = challengerWins ? challengerPassive : opponentPassive;
        const adjustedBet = Math.floor(duel.bet * winnerPassive.coinMultiplier);
        loserData.coins -= duel.bet;
        winnerData.coins += adjustedBet;

        return interaction.update({
            content: `**Duel selesai setelah diterima.**\n> ${duel.challengerName}: ${finalChallenger}${challengerCrit ? ' (critical)' : ''}\n> ${duel.opponentName}: ${finalOpponent}${opponentCrit ? ' (critical)' : ''}\n> Pemenang: ${winnerName}\n> Hadiah: ${adjustedBet.toLocaleString('id-ID')} coins`,
            embeds: [],
            components: []
        }).catch(() => {});
    }

    if (!interaction.customId.startsWith('dash:')) return;

    const [, action] = interaction.customId.split(':');

    if (action === 'close') {
        return interaction.message.delete().catch(() => {});
    }

    return interaction.update({
        embeds: [buildDashboardEmbed(action)],
        components: buildDashboardRows(action)
    }).catch(() => {});
});

client.on('error', (error) => console.error('[discord-client-error]', error));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (error) => console.error('[uncaughtException]', error));

if (!discordToken) {
    botStatus = {
        state: 'failed',
        detail: 'DISCORD_TOKEN / TOKEN belum diisi',
        readyAt: null
    };
    console.error('[startup] Discord token tidak ditemukan. Isi DISCORD_TOKEN di environment Railway.');
} else {
    botStatus = {
        state: 'connecting',
        detail: 'Menghubungkan client Discord',
        readyAt: null
    };

    client.login(discordToken).catch((error) => {
        const detail = error?.code === 'TokenInvalid'
            ? 'Token Discord tidak valid atau sudah direset'
            : (error?.message || 'Gagal login ke Discord');

        botStatus = {
            state: 'failed',
            detail,
            readyAt: null
        };

        console.error('[discord-login-failed]', error);
    });
}
