const { MessageEmbed } = require("discord.js");
const { createQueue } = require("../util/create_queue.js");

module.exports = {
    name: 'forward',
    aliases: ['fw'],
    symbol: '⏩',
    category: 'basic',
    description: 'Fast-forward the current song.',
    execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue) 
            return message.channel.send(`Nothing is playing (${message.author})`).catch(console.error);

        let song = queue.current;
        let time = (queue.connection.dispatcher.streamTime - queue.connection.dispatcher.pausedTime) / 1000;
        let remaining = song.duration - time;
        let forward = 0;
        if(/^\d*$/.test(args[0])) { // By seconds
            let secs = parseInt(args[0]);
            if(secs >= 1) {
                forward = secs;
            }
        } else if(/^\d*:\d\d$/.test(args[0])) { // By minutes & seconds
            let params = args[0].split(':');
            let mins = parseInt(params[0]);
            let secs = parseInt(params[1]);
            if(mins <= 60 || secs <= 59 || mins >= 0 || secs >= 1) {
                forward = mins*60 + secs;
            }
        } else {
            return message.channel.send(`**Usage:** \`${server.prefix}forward <MM:SS | seconds>\` (${message.author})`).catch(console.error);
        }

        if(forward >= remaining)
            return message.channel.send(`The time remaining is only: \`` + 
                new Date(remaining * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '') + `\` (${message.author})`).catch(console.error);

        queue.current.seekTime = parseInt(time) + forward;
        queue.seek = true;
        queue.connection.dispatcher.end();

        return queue.textChannel.send(`⏩ **Fast-forward** \`${forward}\` seconds`).catch(console.error);
    }
};