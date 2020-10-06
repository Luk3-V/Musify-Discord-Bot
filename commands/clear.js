const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'clear',
    symbol: '💥',
    category: 'basic',
    description: 'Clears songs in queue.',
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if (!queue) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        queue.songs = [];

        return queue.textChannel.send('💥 **Cleared**').catch(console.error);
    }
};