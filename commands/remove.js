module.exports = {
    name: 'remove',
    symbol: '❌',
    category: 'basic',
    description: "Remove song from the queue by postition.",
    usage: ['remove <Queue Position>'],
    execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;
        
        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        var val = parseInt(args[0]);
        if(!args.length || isNaN(val) || val > queue.songs.length || val < 0) 
            return message.channel.send(`**Usage:** \`${message.client.prefix}remove <Queue Position>\` (${message.author})`);

        const song = queue.songs.splice(val-1, 1);
        queue.textChannel.send(`❌ **Removed** \`${song[0].title}\` **from the queue**`);
    }
};
