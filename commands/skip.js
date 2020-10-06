const { MessageEmbed } = require("discord.js");
const { loadAutoplay } = require('../util/load_autoplay.js');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    symbol: '⏭',
    category: 'basic',
    description: "Skip the current or multiple song(s).",
    async execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue)
          return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        var song = `\`${queue.current.title}\``;
        var val = parseInt(args[0]);
        if(args.length) {
            if(isNaN(val) || val < 1) {
                return message.channel.send(`**Usage:** \`${server.prefix}skip <Optional: Number>\` (${message.author})`).catch(console.error);
            } else if(!queue.auto) {
                if (val-1 > queue.songs.length) {
                    song += ` **&** \`${queue.songs.length}\` **song(s)**`;
                    queue.songs = [];
                }
                else {
                    song += ` **&** \`${val-1}\` **song(s)**`;
                    queue.songs = queue.songs.slice(val-1);
                }
            } else {
                if (val-1 > queue.autoSongs.length) {
                    song += ` **&** \`${queue.autoSongs.length}\` **song(s)**`;
                    queue.autoSongs = [];
                    await loadAutoplay(queue.current, message);
                }
                else {
                    song += ` **&** \`${val-1}\` **song(s)**`;
                    queue.autoSongs = queue.autoSongs.slice(val-1);
                }
            }
        }
        queue.playing = true;
        queue.connection.dispatcher.end();

        return queue.textChannel.send(`⏭ **Skipped** ${song}`).catch(console.error);
    }
};