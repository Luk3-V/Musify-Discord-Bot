const { MessageEmbed } = require("discord.js");
const { waitTimer } = require("../util/wait_timer.js");

module.exports = {
    name: 'pause',
    symbol: '⏸',
    category: 'basic',
    description: 'Pause the current song.',
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue || !queue.playing) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        waitTimer(server, 60);
        queue.playing = false;
        queue.connection.dispatcher.pause(true);

        return queue.textChannel.send('⏸ **Paused**').catch(console.error);
    }
};