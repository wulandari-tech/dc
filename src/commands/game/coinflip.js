const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../store/runtimeStore');
const { formatCoins, getActiveBoostMultiplier } = require('../../utils/economy');
const { AttachmentBuilder } = require('discord.js');
const { renderCoinflipGif } = require('../../utils/wheelRenderer');

module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    async execute(message, args) {
        const bet = Number.parseInt(args[0], 10);
        const choice = args[1]?.toLowerCase();

        if (!bet || bet < 100 || !['heads', 'tails'].includes(choice)) {
            return message.reply('**Format coinflip salah.**\n> Gunakan: `.coinflip <bet> <heads/tails>`');
        }

        const data = getUser(message.guild.id, message.author.id);
        if (!data || data.coins < bet) {
            return message.reply('**Coins kamu tidak cukup untuk coinflip.**');
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const boost = getActiveBoostMultiplier(data, 'coin');
        if (result === choice) {
            const reward = Math.floor(bet * boost);
            data.coins += reward;
            const rewardText = `Menang ${formatCoins(reward)} coins | boost x${boost}`;
            const gif = await renderCoinflipGif({ result, choice, rewardText });
            const attachment = new AttachmentBuilder(gif, { name: 'coinflip-result.gif' });
            const embed = new EmbedBuilder()
                .setColor(0x06b6d4)
                .setTitle('Coinflip Arena')
                .setDescription(`> Pilihanmu: ${choice}\n> Hasil: ${result}\n> ${rewardText}`)
                .setImage('attachment://coinflip-result.gif');
            return message.reply({ embeds: [embed], files: [attachment] });
        }

        data.coins -= bet;
        const rewardText = `Kalah ${formatCoins(bet)} coins`;
        const gif = await renderCoinflipGif({ result, choice, rewardText });
        const attachment = new AttachmentBuilder(gif, { name: 'coinflip-result.gif' });
        const embed = new EmbedBuilder()
            .setColor(0x06b6d4)
            .setTitle('Coinflip Arena')
            .setDescription(`> Pilihanmu: ${choice}\n> Hasil: ${result}\n> ${rewardText}`)
            .setImage('attachment://coinflip-result.gif');
        return message.reply({ embeds: [embed], files: [attachment] });
    }
};
