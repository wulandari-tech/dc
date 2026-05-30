const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const fs = require('fs');
const User = require('./src/models/User');
const Guild = require('./src/models/Guild');

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

const config = {
    token: "MTQ1NDU0MzYzNzM4Njg5MTUwOQ.GS9Oyx.6lXXvs1g8NfWtW3aYkiDV01R6ATxV0u_MHMD_8",
    mongoURI: "mongodb+srv://wanz:rn3Td8zKDRaLRbDZ@cluster0.bresujd.mongodb.net/dc?appName=Cluster0",
    prefix: ".",
    emoji_1: "<:emoji_1:123456789012345678>"
};

const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./src/commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

async function getOrCreateRole(guild, name, color) {
    let role = guild.roles.cache.find(r => r.name === name);
    if (!role) {
        try {
            role = await guild.roles.create({ name, color, reason: 'System Auto Role' });
        } catch (e) { console.log("Permission Error: Role bot harus di atas!"); }
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
    console.log(`Bot Online: ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
    const now = Date.now();
    joinVelocity.push(now);
    joinVelocity = joinVelocity.filter(t => now - t < 10000);
    if (joinVelocity.length > 8) return member.kick("Raid Protection");

    const gData = await Guild.findOne({ guildId: member.guild.id });
    const welcomeChan = member.guild.channels.cache.get(gData?.welcomeChannel);
    if (welcomeChan) {
        welcomeChan.send(`**Welcome NewCoding** <@${member.id}>**, Selamat datang di server kami!** ${config.emoji_1}`);
    }

    const vChan = member.guild.channels.cache.get(gData?.verifyChannel);
    if (vChan) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('VERIFIKASI').setStyle(ButtonStyle.Success)
        );
        vChan.send({ content: `**Halo <@${member.id}>, klik tombol untuk verifikasi!**`, components: [row] });
    }
});

client.on('guildMemberRemove', async (member) => {
    const gData = await Guild.findOne({ guildId: member.guild.id });
    const log = member.guild.channels.cache.get(gData?.logChannel);
    if (log) log.send(`**📤 Member Leave:** **${member.user.tag}**`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content === `${config.prefix}start`) {
        await message.delete();
        const m = await message.channel.send(`**SYSTEM CLEANED & READY!** ${config.emoji_1}`);
        return setTimeout(() => m.delete(), 3000);
    }

    const logs = msgLog.get(message.author.id) || [];
    logs.push(Date.now());
    msgLog.set(message.author.id, logs.filter(t => Date.now() - t < 5000));
    if (logs.length > 5) return message.delete();

    const phishing = /(discord-nitro|nitro-app|free-nitro|discord-gift|bit\.ly|t\.co|discord\.gg)/i;
    if (phishing.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.delete();
        return;
    }

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
            message.channel.send(`**LEVEL UP!** <@${message.author.id}> **Level ${data.level}**\n**Next:** \`[ ${bar} ]\``);
        }
        xpCooldown.add(message.author.id);
        setTimeout(() => xpCooldown.delete(message.author.id), 60000);
    }

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

client.login(config.token);