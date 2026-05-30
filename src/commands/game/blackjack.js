const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');
const { formatCoins, getActiveBoostMultiplier } = require('../../utils/economy');

function drawCard() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    return cards[Math.floor(Math.random() * cards.length)];
}

function handTotal(cards) {
    let total = cards.reduce((sum, card) => sum + card, 0);
    let aces = cards.filter((card) => card === 11).length;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }
    return total;
}

module.exports = {
    name: 'blackjack',
    aliases: ['bj'],
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        if (!bet || bet < 100) return message.reply('**Minimal taruhan blackjack adalah 100 coins.**');

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) return message.reply('**Coins kamu tidak cukup.**');

        const player = [drawCard(), drawCard()];
        const dealer = [drawCard(), drawCard()];
        const boost = getActiveBoostMultiplier(data, 'coin');
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('Blackjack Table');

        while (handTotal(player) < 17) player.push(drawCard());
        while (handTotal(dealer) < 17) dealer.push(drawCard());

        const playerTotal = handTotal(player);
        const dealerTotal = handTotal(dealer);

        if (playerTotal > 21) {
            data.coins -= bet;
            embed.setDescription(`> Kamu: ${player.join(', ')} = ${playerTotal}\n> Dealer: ${dealer.join(', ')} = ${dealerTotal}\n> Bust dan kalah ${formatCoins(bet)} coins`);
            return message.reply({ embeds: [embed] });
        }

        if (dealerTotal > 21 || playerTotal > dealerTotal) {
            const reward = Math.floor(bet * 1.8 * boost);
            data.coins += reward;
            embed.setDescription(`> Kamu: ${player.join(', ')} = ${playerTotal}\n> Dealer: ${dealer.join(', ')} = ${dealerTotal}\n> Coin boost: x${boost}\n> Menang ${formatCoins(reward)} coins`);
            return message.reply({ embeds: [embed] });
        }

        if (playerTotal === dealerTotal) {
            embed.setDescription(`> Kamu: ${playerTotal}\n> Dealer: ${dealerTotal}\n> Hasil: seri`);
            return message.reply({ embeds: [embed] });
        }

        data.coins -= bet;
        embed.setDescription(`> Kamu: ${playerTotal}\n> Dealer: ${dealerTotal}\n> Hilang ${formatCoins(bet)} coins`);
        return message.reply({ embeds: [embed] });
    }
};
