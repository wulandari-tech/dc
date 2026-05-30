const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration, getActiveBoostMultiplier } = require('../../utils/economy');
const { renderWheelGif } = require('../../utils/wheelRenderer');

const MODES = {
    free: { cooldown: 2 * 3600000, baseMin: 150, baseMax: 500, title: 'Wheel Free' },
    daily: { cooldown: 86400000, baseMin: 900, baseMax: 2600, title: 'Wheel Daily' },
    weekly: { cooldown: 7 * 86400000, baseMin: 4000, baseMax: 12000, title: 'Wheel Weekly' }
};

const BET_SEGMENTS = [
    { label: 'SMALL', multiplier: 1.25 },
    { label: 'BOOST', multiplier: 1.8 },
    { label: 'BIG', multiplier: 2.8 },
    { label: 'JACKPOT', multiplier: 4.5 },
    { label: 'MISS', multiplier: 0 },
    { label: 'BONUS', multiplier: 2.1 }
];

function buildWheelReply({ title, selectedLabel, rewardText, modeLabel }) {
    return renderWheelGif({ title, selectedLabel, rewardText, modeLabel }).then((buffer) => {
        const attachment = new AttachmentBuilder(buffer, { name: 'wheel-result.gif' });
        const embed = new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle(title)
            .setDescription(rewardText)
            .setImage('attachment://wheel-result.gif');

        return { embeds: [embed], files: [attachment] };
    });
}

module.exports = {
    name: 'wheel',
    aliases: ['spin'],
    async execute(message, args) {
        const data = ensureUser(message.guild.id, message.author.id);
        const arg = args[0]?.toLowerCase();
        const boost = getActiveBoostMultiplier(data, 'coin');

        if (arg && MODES[arg]) {
            const key = `lastWheel_${arg}`;
            const mode = MODES[arg];
            const now = Date.now();
            if (data[key]) {
                const remaining = mode.cooldown - (now - data[key]);
                if (remaining > 0) {
                    return message.reply(`**${mode.title} masih cooldown.**\n> Tunggu ${formatDuration(remaining)}`);
                }
            }

            const reward = Math.floor((mode.baseMin + Math.random() * (mode.baseMax - mode.baseMin)) * boost);
            data[key] = now;
            data.coins += reward;

            return message.reply(await buildWheelReply({
                title: mode.title,
                selectedLabel: 'REWARD',
                rewardText: `Reward ${formatCoins(reward)} coins | boost x${boost}`,
                modeLabel: `Mode ${arg.toUpperCase()}`
            }));
        }

        const bet = Number.parseInt(args[0], 10);
        if (!bet || bet < 100) {
            return message.reply('**Gunakan:** `.wheel <bet>` atau `.wheel free|daily|weekly`');
        }

        if (data.coins < bet) return message.reply('**Coins kamu tidak cukup untuk wheel bet.**');

        const segment = BET_SEGMENTS[Math.floor(Math.random() * BET_SEGMENTS.length)];
        if (segment.multiplier === 0) {
            data.coins -= bet;
            return message.reply(await buildWheelReply({
                title: 'Wheel Bet',
                selectedLabel: segment.label,
                rewardText: `Kalah ${formatCoins(bet)} coins`,
                modeLabel: 'BET MODE'
            }));
        }

        const reward = Math.floor(bet * segment.multiplier * boost);
        data.coins += reward;

        return message.reply(await buildWheelReply({
            title: 'Wheel Bet',
            selectedLabel: segment.label,
            rewardText: `Menang ${formatCoins(reward)} coins | x${segment.multiplier} | boost x${boost}`,
            modeLabel: 'BET MODE'
        }));
    }
};
