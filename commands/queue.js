const { MessageEmbed, splitMessage, escapeMarkdown } = require("discord.js");

module.exports = {
    name: 'queue',
    aliases: ['q'],
    symbol: '📑',
    category: 'basic',
    description: "Shows song queue and current song.",
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;
        
        if (!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        let description = `**Current Song:** [${escapeMarkdown(queue.current.title)}](${queue.current.url})`;
        if(queue.auto)
            description += ' *(autoplay)*';
        if(queue.songs.length)
            description += '\n' + queue.songs.map((song, index) => `\n${index + 1}. [${escapeMarkdown(song.title)}](${song.url})`).join("");;
        if(queue.autoSongs.length) 
            description += '\n\n**Autoplay Queue:**' + queue.autoSongs.map((song, index) => `\n${index + 1}. ${song[0]} - ${song[1]}`).join("");;

        let queueEmbed = new MessageEmbed()
            .setColor('#1DB954')
            .setTitle('📑  Queue')
            .setDescription(description);

        const splitDescription = splitMessage(description, {
            maxLength: 2048,
            char: "\n",
            prepend: "",
            append: ""
        });

        splitDescription.forEach(async (e) => {
            queueEmbed.setDescription(e);
            message.channel.send(queueEmbed);
        });
    }
};