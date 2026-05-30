const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const config = require('./src/config.json');
const { ensureGuild, updateUser } = require('./src/store/runtimeStore');

const app = express();
app.get('/', (req, res) => res.send('System Online'));
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

client.commands = new Collection();
const xpCooldown = new Set();
const msgLog = new Map();
let joinVelocity = [];
const customEmoji = "<:emoji_1:1510146476150358137>";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    return getRole(guild, 'Member', 'Green');
}

client.once('clientReady', async () => {
    for (const guild of client.guilds.cache.values()) {
        getGuildSettings(guild.id);
    }
    console.log(`✅ ${client.user.tag} is ready with Advanced UI`);
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

    if (channel) {
        await channel.send(`**Welcome NewCoding** <@${member.id}>**, Selamat datang di server kami!** ${config.emoji_1}`).catch(() => null);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('VERIFIKASI').setStyle(ButtonStyle.Success)
        );
        await channel.send({ content: `**Halo <@${member.id}>, klik tombol untuk verifikasi!**`, components: [row] }).catch(() => null);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    getGuildSettings(message.guild.id);

    // --- FITUR .START DENGAN BOOT SEQUENCE & DASHBOARD ---
    if (message.content === `${config.prefix}start`) {
        await message.delete().catch(() => {});
        
        const stages = [
            { t: "Initializing core...", b: "[##--------] 20%" },
            { t: "Loading protection modules...", b: "[#####-----] 50%" },
            { t: "Syncing commands...", b: "[########--] 80%" },
            { t: "Rendering control panel...", b: "[##########] 100%" }
        ];

        let loadMsg = await message.channel.send(`**${stages[0].t}**\n\`${stages[0].b}\``);
        for (let i = 1; i < stages.length; i++) {
            await sleep(800);
            await loadMsg.edit(`**${stages[i].t}**\n\`${stages[i].b}\``);
        }
        await sleep(500);
        await loadMsg.delete().catch(() => {});

        const dashEmbed = new EmbedBuilder()
            .setTitle(`${customEmoji} **DASHBOARD**`)
            .setColor("#2F3136")
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`**Sistem telah berhasil dimuat. Berikut adalah daftar perintah yang tersedia untuk Anda.**`)
            .addFields(
                { name: "🛡️ **MODERATION**", value: "`.setup`, `.mod`", inline: true },
                { name: "💰 **ECONOMY**", value: "`.bal`, `.daily`, `.shop`, `.transfer`, `.collection`", inline: true },
                { name: "🆙 **LEVELING**", value: "`.rank`, `.leaderboard`", inline: true },
                { name: "🎮 **GAMES**", value: "`.dice`", inline: true },
                { name: "🛠️ **UTILITY**", value: "`.start`", inline: true }
            )
            .setFooter({ text: "©2026 Copyright WANZOFC.", iconURL: client.user.displayAvatarURL() });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('m_mod').setLabel('Moderation').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('m_eco').setLabel('Economy').setEmoji('💰').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('m_lev').setLabel('Leveling').setEmoji('🆙').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('m_gam').setLabel('Games').setEmoji('🎮').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('m_cls').setLabel('Close').setEmoji('❌').setStyle(ButtonStyle.Danger)
        );

        return message.channel.send({ embeds: [dashEmbed], components: [row1, row2] });
    }

    const logs = msgLog.get(message.author.id) || [];
    logs.push(Date.now());
    msgLog.set(message.author.id, logs.filter((time) => Date.now() - time < 5000));
    if (logs.length > 5) return message.delete().catch(() => {});

    if (/(discord-nitro|free-nitro|discord\.gg|https?:\/\/)/i.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.delete().catch(() => {});
    }

    if (!xpCooldown.has(message.author.id)) {
        const data = updateUser(message.guild.id, message.author.id, (user) => { user.xp += 25; });
        const next = data.level * 1000;
        if (data.xp >= next) {
            data.level += 1; data.xp = 0;
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

    if (interaction.customId === 'verify_btn') {
        const role = await resolveMemberRole(interaction.guild);
        if (role) {
            await interaction.member.roles.add(role).catch(() => {});
            return interaction.reply({ content: '**Verifikasi Berhasil!**', ephemeral: true }).catch(() => {});
        }
    }

    if (interaction.customId === 'm_cls') return interaction.message.delete().catch(() => {});
    
    if (interaction.customId.startsWith('m_')) {
        const cat = interaction.customId.split('_')[1].toUpperCase();
        return interaction.reply({ content: `**Menu ${cat} telah diaktifkan di Dashboard!**`, ephemeral: true });
    }
});

client.on('error', (error) => console.error('[discord-client-error]', error));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (error) => console.error('[uncaughtException]', error));

client.login(config.token);