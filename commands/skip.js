const { MessageEmbed } = require("discord.js");
const { loadAutoplay } = require('./util/load_autoplay.js');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    symbol: '⏭',
    description: "Skip the current or multiple song(s).",
    async execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);
        if(!queue)
          return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        var song = `\`${queue.current.title}\``;
        if(args.length) {
            if(isNaN(args[0])) {
                return message.channel.send(`**Usage:** \`${message.client.prefix}${module.exports.name} <Optional: Number>\` (${message.author})`).catch(console.error);
            } else if(!queue.auto) {
                if (args[0]-1 > queue.songs.length) {
                    song += ` **&** \`${queue.songs.length-1}\` **song(s)**`;
                    queue.songs = [];
                }
                else {
                    song += ` **&** \`${args[0]-1}\` **song(s)**`;
                    queue.songs = queue.songs.slice(args[0]-1);
                }
            } else {
                if (args[0]-1 > queue.autoSongs.length) {
                    song += ` **&** \`${queue.autoSongs.length-1}\` **song(s)**`;
                    queue.autoSongs = [];
                    await loadAutoplay(queue.current, message);
                }
                else {
                    song += ` **&** \`${args[0]-1}\` **song(s)**`;
                    queue.autoSongs = queue.autoSongs.slice(args[0]-1);
                }
            }
        }
        queue.playing = true;
        queue.connection.dispatcher.end();

        return queue.textChannel.send(`⏭ **Skipped** ${song}`).catch(console.error);
    }
};