const { VERSION } = require('../config.json');
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: 'help',
  aliases: ['h'],
  symbol: 'ℹ️',
  description: "Display all commands and descriptions",
  execute(message) {
    let commands = message.client.commands.array();

    let helpEmbed = new MessageEmbed()
      .setColor('#1DB954')
      .setTitle(`ℹ️  Commands (BETA v${VERSION})`);     

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `${cmd.symbol} \`${message.client.prefix}${cmd.name}\``,
        `${cmd.description}`,
        true
      );
    });

    return message.channel.send(helpEmbed).catch(console.error);
  }
};