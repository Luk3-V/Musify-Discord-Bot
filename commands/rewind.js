const { MessageEmbed } = require("discord.js");
const { createQueue } = require("./util/create_queue.js");

module.exports = {
    name: 'rewind',
    aliases: ['rw'],
    symbol: '⏪',
    category: 'basic',
    description: 'Rewind the current song.',
    execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);
        if(!queue) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        let song = queue.current;
        let time = song.seekTime + (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
        let rewind = 0;
        if(/^\d*$/.test(args[0])) { // By seconds
            let secs = parseInt(args[0]);
            if(secs >= 1) {
                rewind = secs;
            }
        } else if(/^\d*:\d\d$/.test(args[0])) { // By minutes & seconds
            let params = args[0].split(':');
            let mins = parseInt(params[0]);
            let secs = parseInt(params[1]);
            if(mins <= 60 || secs <= 59 || mins >= 0 || secs >= 1) {
                rewind = mins*60 + secs;
            }
        } else {
            return message.channel.send(`**Usage:** \`${message.client.prefix}rewind <MM:SS | seconds>\` (${message.author})`).catch(console.error);
        }

        if(rewind >= time)
            return message.channel.send(`The time played is only: \`` + 
                new Date(time * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '') + `\` (${message.author})`).catch(console.error);

        queue.current.seekTime = parseInt(time) - rewind;
        queue.seek = true;
        queue.connection.dispatcher.end();

        return queue.textChannel.send(`⏩ **Rewind** \`${rewind}\` seconds`).catch(console.error);
    }
};