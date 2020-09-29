

module.exports = {
    name: 'volume',
    aliases: ['v'],
    symbol: '🔊',
    description: "Edit or view volume.",
    execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);

        if(!args.length) 
            return message.channel.send(`🔊 **The current volume is:** \`${message.client.volume}%\``).catch(console.error);
        if(isNaN(args[0]) || parseInt(args[0]) > 100 || parseInt(args[0]) < 0)
            return message.channel.send(`**Usage:** \`${message.client.prefix}volume <Number between 1-100>\` (${message.author})`).catch(console.error);

        message.client.volume = args[0];
        if(queue)
            queue.connection.dispatcher.setVolumeLogarithmic(args[0] / 100);

        return message.channel.send(`🔊  **Volume set to:** \`${args[0]}%\``).catch(console.error);
    }
};