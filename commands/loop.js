module.exports = {
    name: "loop",
    symbol: '🔁',
    category: 'basic',
    description: "Toggle loop option.",
    execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);
        if (!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        if(!args.length) {
            queue.loop = !queue.loop;
        } else if(args[0].toLowerCase() == 'on') {
            message.client.autoplay = true;
        } else if(args[0].toLowerCase() == 'off') {
            message.client.autoplay = false;
        } else {
            return message.channel.send(`**Usage:** \`${message.client.prefix}loop <on | off>\` ${message.author}`).catch(console.error);
        }

        return queue.textChannel.send(`🔁 **Loop turned** \`${queue.loop ? "ON" : "OFF"}\``).catch(console.error);
    }
};