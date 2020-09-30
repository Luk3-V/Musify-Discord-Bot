const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'stop',
    symbol: '⏹',
    description: 'Stops playing songs.',
    execute(message) {
        const queue = message.client.queues.get(message.guild.id);

        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        queue.voiceChannel.leave();

        return queue.textChannel.send('⏹ **Stopped**').catch(console.error);
    }
};