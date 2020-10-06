const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'stop',
    symbol: '⏹',
    category: 'basic',
    description: 'Stops playing songs.',
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        queue.voiceChannel.leave();

        return queue.textChannel.send('⏹ **Stopped**').catch(console.error);
    }
};