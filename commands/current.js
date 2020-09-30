const createBar = require("string-progressbar");
const { MessageEmbed } = require("discord.js");

module.exports = {
    name: 'current',
    symbol: '🎵',
    description: "Display current song info.",
    execute(message) {
        const queue = message.client.queues.get(message.guild.id);
        if (!queue) 
        return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        const song = queue.current;
        const time = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
        const remainder = song.duration - time;

        let currentEmbed = new MessageEmbed()
            .setColor('#1DB954')
            .setTitle('🎵  Current Song')
            .setThumbnail(song.image)
            .setDescription(`[**${song.title}**](${song.url})`)
            .addField(new Date(time * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '') +
                '\u0009' +
                createBar(song.duration == 0 ? time : song.duration, time, 12)[0] +
                '\u0009' +
                (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '')),
                (queue.playing ? '(*playing*)' : '(*paused*)'),
                false
            );

        //if(song.duration > 0)
        //    currentEmbed.setFooter(new Date(remainder * 1000).toISOString().substr(11, 8));

        return message.channel.send(currentEmbed);
    }
};