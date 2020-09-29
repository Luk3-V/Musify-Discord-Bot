const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'pause',
    symbol: '⏸',
    description: 'Pause the current song.',
    execute(message) {
        const queue = message.client.queues.get(message.guild.id);
        if(!queue) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        if(queue.playing) {
            queue.playing = false;
            queue.connection.dispatcher.pause(true);

            /*let embed = new MessageEmbed()
                .setColor("#1DB954")
                .setTitle('⏸  Paused');*/

            return queue.textChannel.send('⏸ **Paused**').catch(console.error);
        }
    }
};