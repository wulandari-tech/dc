const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const fs = require('fs');

// Membaca file config
const config = require('./src/config.json');
const User = require('./src/models/User');
const Guild = require('./src/models/Guild'); // Pastikan file ini ada di folder models

const app = express();
app.get('/', (req, res) => res.send('Bot is Active'));
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

// Load Commands
const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./src/commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

// Fungsi Bantu
async function getOrCreateRole(guild, name, color) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) {
        try {
            role = await guild.roles.create({ name, color, reason: 'System Auto Role' });
        } catch (e) { console.log("Gagal buat role: Pastikan role bot paling atas!"); }
    }
    return role;
}

function createBar(current, total) {
    const size = 10;
    const progress = Math.round((size * current) / total);
    return "▰".repeat(progress) + "▱".repeat(size - progress);
}

client.on('ready', async () => {
    await mongoose.connect(config.mongoURI);
    console.log(`✅ Berhasil Login: ${client.user.tag}`);
});

// Event Member Join
client.on('guildMemberAdd', async (member) => {
    const now = Date.now();
    joinVelocity.push(now);
    joinVelocity = joinVelocity.filter(t => now - t < 10000);
    if (joinVelocity.length > 8) return member.kick("Raid Protection");

    const welcomeChan = member.guild.channels.cache.get(config.welcomeChannel);
    if (welcomeChan) {
        welcomeChan.send(`**Welcome NewCoding** <@${member.id}>**, Selamat datang!** ${config.emoji_1}`);
    }

    const vChan = member.guild.channels.cache.get(config.verifyChannel);
    if (vChan) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('VERIFIKASI').setStyle(ButtonStyle.Success)
        );
        vChan.send({ content: `**Halo <@${member.id}>, klik tombol untuk verifikasi!**`, components: [row] });
    }
});

// Event Message
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === `${config.prefix}start`) {
        await message.delete();
        const m = await message.channel.send(`**SYSTEM CLEANED & READY!** ${config.emoji_1}`);
        return setTimeout(() => m.delete(), 3000);
    }

    // Anti Spam & Phishing
    const logs = msgLog.get(message.author.id) || [];
    logs.push(Date.now());
    msgLog.set(message.author.id, logs.filter(t => Date.now() - t < 5000));
    if (logs.length > 5) return message.delete();

    const phishing = /(discord-nitro|free-nitro|discord\.gg)/i;
    if (phishing.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.delete();
    }

    // Leveling System
    if (!xpCooldown.has(message.author.id)) {
        let data = await User.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { $inc: { xp: 25 } },
            { upsert: true, new: true }
        );

        const nextLv = data.level * 1000;
        if (data.xp >= nextLv) {
            data.level += 1;
            data.xp = 0;
            await data.save();

            const role = await getOrCreateRole(message.guild, `Elite Level ${data.level}`, 'Gold');
            if (role) await message.member.roles.add(role);

            const bar = createBar(data.xp, nextLv);
            message.channel.send(`**LEVEL UP!** <@${message.author.id}> **Level ${data.level}**\n\`[ ${bar} ]\``);
        }
        xpCooldown.add(message.author.id);
        setTimeout(() => xpCooldown.delete(message.author.id), 60000);
    }

    // Command Handler
    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const command = client.commands.get(cmdName) || client.commands.find(c => c.aliases?.includes(cmdName));

    if (command) {
        try { command.execute(message, args, client); } catch (e) { console.error(e); }
    }
});

client.on('interactionCreate', async (i) => {
    if (!i.isButton()) return;
    if (i.customId === 'verify_btn') {
        const role = await getOrCreateRole(i.guild, 'Member', 'Green');
        if (role) {
            await i.member.roles.add(role);
            await i.reply({ content: "**Verifikasi Berhasil!**", ephemeral: true });
        }
    }
});

// Login menggunakan token dari config.json
client.login(config.token).catch(err => {
    console.error("❌ TOKEN SALAH/EXPIRED! Silahkan Reset Token di Dev Portal.");
});