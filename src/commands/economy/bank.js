const { ensureUser } = require('../../store/runtimeStore');
const { formatCoins, formatDuration } = require('../../utils/economy');
const { getPetPassive } = require('../../utils/petSystem');

module.exports = {
    name: 'bank',
    async execute(message, args) {
        const data = ensureUser(message.guild.id, message.author.id);
        const action = args[0]?.toLowerCase();
        const amount = args[1] === 'all' ? null : Number.parseInt(args[1], 10);

        if (!action) {
            return message.reply(`**Bank Account**\n> Cash: ${formatCoins(data.coins)} coins\n> Bank: ${formatCoins(data.bank)} coins`);
        }

        if (action === 'deposit') {
            const moveAmount = args[1] === 'all' ? data.coins : amount;
            if (!moveAmount || moveAmount <= 0 || data.coins < moveAmount) {
                return message.reply('**Jumlah deposit tidak valid.**');
            }
            data.coins -= moveAmount;
            data.bank += moveAmount;
            return message.reply(`**Deposit berhasil.**\n> ${formatCoins(moveAmount)} coins masuk ke bank`);
        }

        if (action === 'withdraw') {
            const moveAmount = args[1] === 'all' ? data.bank : amount;
            if (!moveAmount || moveAmount <= 0 || data.bank < moveAmount) {
                return message.reply('**Jumlah withdraw tidak valid.**');
            }
            data.bank -= moveAmount;
            data.coins += moveAmount;
            return message.reply(`**Withdraw berhasil.**\n> ${formatCoins(moveAmount)} coins keluar dari bank`);
        }

        if (action === 'heist') {
            const target = message.mentions.users.first();
            if (!target || target.id === message.author.id) {
                return message.reply('**Gunakan:** `.bank heist @user`');
            }

            const now = Date.now();
            const cooldown = 90 * 60000;
            if (data.lastBankHeist) {
                const remaining = cooldown - (now - data.lastBankHeist);
                if (remaining > 0) {
                    return message.reply(`**Bank heist masih cooldown.**\n> Tunggu ${formatDuration(remaining)}`);
                }
            }

            if (data.coins < 5000) {
                return message.reply('**Bank heist butuh modal besar.**\n> Minimal punya 5.000 coins.');
            }

            const victim = ensureUser(message.guild.id, target.id);
            if (victim.bank < 3000) {
                return message.reply('**Saldo bank target terlalu kecil untuk dibobol.**');
            }

            data.lastBankHeist = now;
            if (!data.criminal) data.criminal = { wantedLevel: 0, hackMeter: 0 };
            if (!victim.criminal) victim.criminal = { wantedLevel: 0, hackMeter: 0 };

            const petPassive = getPetPassive(data, 'bank_heist');
            const shieldConsumed = victim.items.firewall_core ? 'firewall_core' : victim.items.bank_shield ? 'bank_shield' : null;
            const meterBonus = Math.min(0.18, (data.criminal.hackMeter || 0) / 500);
            let successChance = petPassive.pet?.key === 'hacker_pet' ? 0.62 : 0.28;
            successChance += meterBonus;
            if (shieldConsumed === 'firewall_core') successChance -= 0.24;
            else if (shieldConsumed === 'bank_shield') successChance -= 0.14;
            const success = Math.random() < successChance;

            if (shieldConsumed) {
                victim.items[shieldConsumed] -= 1;
                if (victim.items[shieldConsumed] <= 0) delete victim.items[shieldConsumed];
            }

            if (success) {
                const amount = Math.floor((1500 + Math.random() * Math.min(12000, victim.bank)) * petPassive.coinMultiplier);
                victim.bank = Math.max(0, victim.bank - amount);
                data.coins += amount;
                data.criminal.hackMeter = Math.min(100, (data.criminal.hackMeter || 0) + 22);
                data.criminal.wantedLevel = Math.min(10, (data.criminal.wantedLevel || 0) + 2);
                return message.reply(`**Bank heist berhasil.**\n> Target: ${target.username}\n> Hacker bonus: x${petPassive.coinMultiplier.toFixed(2)}\n> Shield target: ${shieldConsumed || 'none'}\n> Hack meter: ${data.criminal.hackMeter}%\n> Wanted level: ${data.criminal.wantedLevel}\n> Rampasan: ${formatCoins(amount)} coins dari bank target`);
            }

            const penalty = 2200 + Math.floor(Math.random() * 2800);
            data.coins = Math.max(0, data.coins - penalty);
            data.criminal.hackMeter = Math.max(0, (data.criminal.hackMeter || 0) - 18);
            data.criminal.wantedLevel = Math.min(10, (data.criminal.wantedLevel || 0) + 1);
            return message.reply(`**Bank heist gagal.**\n> Sistem keamanan bank mendeteksi penyusupan.\n> Shield target: ${shieldConsumed || 'none'}\n> Hack meter: ${data.criminal.hackMeter}%\n> Wanted level: ${data.criminal.wantedLevel}\n> Denda: ${formatCoins(penalty)} coins`);
        }

        return message.reply('**Gunakan:** `.bank`, `.bank deposit <jumlah|all>`, `.bank withdraw <jumlah|all>`, `.bank heist @user`');
    }
};
