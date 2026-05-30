const { updateGuild } = require('../../store/runtimeStore');
const config = require('../../config.json');

module.exports = {
    name: 'setup',
    permissions: ['Administrator'],
    async execute(message, args) {
        const option = args[0]?.toLowerCase();
        const channelId = message.mentions.channels.first()?.id;
        const roleId = message.mentions.roles.first()?.id;
        const value = option === 'role' ? roleId : channelId;

        if (!option || !value || !['welcome', 'log', 'verify', 'role'].includes(option)) {
            return message.reply('**Format: .setup [welcome/log/verify/role] @mention**');
        }

        updateGuild(message.guild.id, (guild) => {
            if (option === 'welcome') guild.welcomeChannel = value;
            if (option === 'log') guild.logChannel = value;
            if (option === 'verify') guild.verifyChannel = value;
            if (option === 'role') guild.memberRole = value;
        }, {
            welcomeChannel: config.welcomeChannel,
            logChannel: config.logChannel,
            verifyChannel: config.verifyChannel,
            memberRole: config.memberRole
        });

        return message.reply(`**Berhasil mengatur ${option} ke ${option === 'role' ? `<@&${value}>` : `<#${value}>`}!**`);
    }
};
