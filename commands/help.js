const { VERSION } = require('../config.json');
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'help',
    aliases: ['h'],
    symbol: 'ℹ️',
    category: 'basic',
    description: "Display all commands and descriptions",
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        let commands = message.client.commands.array();

        let basic = [];
        let advanced = [];
        commands.forEach((cmd) => {
            switch(cmd.category) {
                case 'basic': basic.push(`${cmd.symbol} \`${cmd.name}\`\n`);
                    break;
                case 'advanced': advanced.push(`${cmd.symbol} \`${cmd.name}\`\n`);
                    break;
            }
        });

        let helpEmbed = new MessageEmbed()
            .setColor('#1DB954')
            .setTitle(`ℹ️  Commands (BETA v${VERSION})`)
            .setDescription(`**Prefix: \`${server.prefix}\`**`)     
            .addField('Basic:', basic.join(''), true)
            .addField('Advanced:', advanced.join(''), true)
            .setFooter(`\"${server.prefix}help <Command>\" for more info`);


        return message.channel.send(helpEmbed).catch(console.error);
    }
};