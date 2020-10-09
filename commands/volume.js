module.exports = {
    name: 'volume',
    aliases: ['v'],
    symbol: '🔊',
    category: 'basic',
    description: "View or set the volume. Volume must be a number between 1-200.",
    usage: ['volume', 'volume <Number 1-200>'],
    execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        var val = parseInt(args[0]);
        if(!args.length) 
            return message.channel.send(`🔊 **The current volume is:** \`${server.volume}%\``).catch(console.error);
        if(isNaN(val) || val > 200 || val < 0 )
            return message.channel.send(`**Usage:** \`${server.prefix}volume <Number 1-200>\` (${message.author})`).catch(console.error);

        server.volume = val;
        if(queue)
            queue.connection.dispatcher.setVolumeLogarithmic(val / 100);

        return message.channel.send(`🔊  **Volume set to:** \`${val}%\``).catch(console.error);
    }
};