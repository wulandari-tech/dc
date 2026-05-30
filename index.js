const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const config = require('./src/config.json');
const User = require('./src/models/User');

// --- SERVER UNTUK VERCEL (KEEP ALIVE) ---
const app = express();
app.get('/', (req, res) => res.send('Bot is Online!'));
app.listen(3000, () => console.log('🌐 Web Server Active'));

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ] 
});

const xpCooldown = new Set();

// --- FUNGSI AUTO ROLE (Mencari atau Membuat Role) ---
async function getOrCreateRole(guild, name, color) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) {
        try {
            role = await guild.roles.create({
                name: name,
                color: color || 'Blue',
                reason: 'Auto-created by Bot System'
            });
            console.log(`✅ Created Role: ${name}`);
        } catch (e) {
            console.log(`❌ Gagal buat role ${name}: Posisi role bot harus paling atas!`);
        }
    }
    return role;
}

client.on('ready', () => {
    mongoose.connect(config.mongoURI);
    console.log(`🚀 Logged in as ${client.user.tag}`);
});

// --- WELCOME & VERIFY ---
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(config.welcomeChannel);
    if (channel) {
        channel.send(`**Welcome NewCoding** <@${member.id}>**, Selamat datang!** ${config.emoji_1}`);
    }

    // Kirim tombol verifikasi otomatis
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('verify_auto').setLabel('KLIK UNTUK MASUK').setStyle(ButtonStyle.Primary)
    );
    if (channel) channel.send({ content: `**Silahkan verifikasi disini <@${member.id}>**`, components: [row] });
});

// --- MESSAGE ENGINE (XP & AUTO ROLE REWARD) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Perintah .start
    if (message.content === '.start') {
        await message.delete();
        return message.channel.send(`**SYSTEM READY!**`).then(m => setTimeout(() => m.delete(), 2000));
    }

    // Anti-Link
    if (/(https?:\/\/|discord\.gg)/i.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.delete();
    }

    // XP & Leveling
    if (!xpCooldown.has(message.author.id)) {
        let data = await User.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { $inc: { xp: 25 } },
            { upsert: true, new: true }
        );

        if (data.xp >= data.level * 1000) {
            data.level += 1;
            data.xp = 0;
            await data.save();

            message.channel.send(`**LEVEL UP!** <@${message.author.id}> mencapai **Level ${data.level}**`);

            // AUTO ROLE REWARD (Berdasarkan Nama)
            if (data.level === 5) {
                const role = await getOrCreateRole(message.guild, 'Elite Level 5', 'Gold');
                if (role) await message.member.roles.add(role);
            }
        }
        xpCooldown.add(message.author.id);
        setTimeout(() => xpCooldown.delete(message.author.id), 60000);
    }
});

// --- INTERACTION HANDLER (VERIFY TANPA ID) ---
client.on('interactionCreate', async (i) => {
    if (i.customId === 'verify_auto') {
        // Otomatis cari/buat role bernama "Member"
        const role = await getOrCreateRole(i.guild, 'Member', 'Green');
        if (role) {
            await i.member.roles.add(role);
            await i.reply({ content: "**Verifikasi Berhasil! Kamu sekarang adalah Member.**", ephemeral: true });
        }
    }
});

client.login(config.token);