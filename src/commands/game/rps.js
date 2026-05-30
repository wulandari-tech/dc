const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');
const { formatCoins, getActiveBoostMultiplier } = require('../../utils/economy');

const MOVES = ['rock', 'paper', 'scissors'];
const BEATS = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
};

module.exports = {
    name: 'rps',
    aliases: ['suit'],
    async execute(message, args) {
        const move = args[0]?.toLowerCase();
        const bet = Number.parseInt(args[1], 10);

        if (!MOVES.includes(move) || !bet || bet < 100) {
            return message.reply('**Format rps salah.**\n> Gunakan: `.rps <rock/paper/scissors> <bet>`');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) {
            return message.reply('**Coins kamu tidak cukup untuk rps.**');
        }

        const botMove = MOVES[Math.floor(Math.random() * MOVES.length)];
        const boost = getActiveBoostMultiplier(data, 'coin');
        const embed = new EmbedBuilder().setColor(0x10b981).setTitle('RPS Duel');
        if (move === botMove) {
            embed.setDescription(`> Kamu: ${move}\n> Bot: ${botMove}\n> Hasil: seri`);
            return message.reply({ embeds: [embed] });
        }

        if (BEATS[move] === botMove) {
            const reward = Math.floor(bet * 1.5 * boost);
            data.coins += reward;
            embed.setDescription(`> Kamu: ${move}\n> Bot: ${botMove}\n> Coin boost: x${boost}\n> Menang ${formatCoins(reward)} coins`);
            return message.reply({ embeds: [embed] });
        }

        data.coins -= bet;
        embed.setDescription(`> Kamu: ${move}\n> Bot: ${botMove}\n> Kalah ${formatCoins(bet)} coins`);
        return message.reply({ embeds: [embed] });
    }
};
