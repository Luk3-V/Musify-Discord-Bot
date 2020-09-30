

module.exports = {
    name: 'volume',
    aliases: ['v'],
    symbol: '🔊',
    description: "Edit or view volume.",
    execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);

        var val = parseInt(args[0]);
        if(!args.length) 
            return message.channel.send(`🔊 **The current volume is:** \`${message.client.volume}%\``).catch(console.error);
        if(isNaN(val) || val > 100 || val < 0 )
            return message.channel.send(`**Usage:** \`${message.client.prefix}volume <Number between 1-100>\` (${message.author})`).catch(console.error);

        message.client.volume = val;
        if(queue)
            queue.connection.dispatcher.setVolumeLogarithmic(val / 100);

        return message.channel.send(`🔊  **Volume set to:** \`${val}%\``).catch(console.error);
    }
};