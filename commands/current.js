const createBar = require("string-progressbar");
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'current',
    symbol: '🎵',
    category: 'basic',
    description: "Display current song info.",
    usage: ['current'],
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;
        
        if (!queue) 
        return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        const song = queue.current;
        const time = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
        const remainder = song.duration - time;

        let currentEmbed = new MessageEmbed()
            .setColor('#1DB954')
            .setTitle('🎵  Current Song')
            .setThumbnail(song.image)
            .setDescription(`[**${song.title}**](${song.url}) ` + (queue.auto ? '*(autoplay)*' : ''))
            .addField(new Date(time * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '') +
                '\u0009' +
                createBar(song.duration == 0 ? time : song.duration, time, 16, '▬', '⚪')[0] +
                '\u0009' +
                (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '')),
                '\u200b',
                false
            )
            .addField('Queued By:', song.user, true)
            .addField('Channel:', song.channel, true)
            .addField('Time Remaining:', new Date(remainder * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, ''), true);
            
        return message.channel.send(currentEmbed);
    }
};