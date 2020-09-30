const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'clear',
    symbol: '💥',
    description: 'Clears songs in queue.',
    execute(message) {
        const queue = message.client.queues.get(message.guild.id);

        if (!queue) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        queue.songs = [];

        return queue.textChannel.send('💥 **Cleared**').catch(console.error);
    }
};