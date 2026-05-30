const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins } = require('../../utils/economy');
const { createDuelChallenge } = require('../../store/duelStore');

module.exports = {
    name: 'duel',
    async execute(message, args) {
        const target = message.mentions.users.first();
        const bet = Number.parseInt(args[1], 10);

        if (!target || target.id === message.author.id || !bet || bet < 100) {
            return message.reply('**Gunakan:** `.duel @user <bet>`');
        }

        const challenger = ensureUser(message.guild.id, message.author.id);
        const opponent = ensureUser(message.guild.id, target.id);

        if (challenger.coins < bet || opponent.coins < bet) {
            return message.reply('**Salah satu pihak tidak punya coins yang cukup untuk duel.**');
        }

        const duel = createDuelChallenge({
            guildId: message.guild.id,
            challengerId: message.author.id,
            opponentId: target.id,
            bet,
            challengerName: message.author.username,
            opponentName: target.username
        });

        const embed = new EmbedBuilder()
            .setColor(0xdc2626)
            .setTitle('Duel Challenge')
            .setDescription([
                `**${message.author.username}** menantang **${target.username}**`,
                `> Taruhan: ${formatCoins(bet)} coins`,
                '> Duel baru berjalan jika lawan menekan tombol accept.',
                '> Tantangan kedaluwarsa dalam 2 menit.'
            ].join('\n'));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`duel_accept|${duel.id}`)
                .setLabel('Accept Duel')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`duel_decline|${duel.id}`)
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger)
        );

        return message.reply({
            content: `<@${target.id}> kamu ditantang duel oleh <@${message.author.id}>`,
            embeds: [embed],
            components: [row]
        });
    }
};
