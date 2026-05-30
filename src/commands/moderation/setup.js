const Guild = require('../../models/Guild');

module.exports = {
    name: 'setup',
    permissions: ['Administrator'],
    async execute(message, args) {
        const option = args[0];
        const value = message.mentions.channels.first()?.id || message.mentions.roles.first()?.id;

        if (!option || !value) return message.reply("**Format: .setup [welcome/log/verify/role] @mention**");

        let guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData) guildData = await Guild.create({ guildId: message.guild.id });

        if (option === 'welcome') guildData.welcomeChannel = value;
        if (option === 'log') guildData.logChannel = value;
        if (option === 'verify') guildData.verifyChannel = value;
        if (option === 'role') guildData.memberRole = value;

        await guildData.save();
        message.reply(`**Berhasil mengatur ${option} ke <#${value} || @&${value}>!**`);
    }
};