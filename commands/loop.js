module.exports = {
    name: "loop",
    symbol: '🔁',
    category: 'basic',
    description: "Toggle loop option. (Loop will repeatedly play the songs in queue)",
    usage: ['loop', 'loop <on | off>'],
    execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);
        if(queue.auto) 
            return message.channel.send(`Can't loop autoplay (${message.author})`).catch(console.error);

        if(!args.length) {
            queue.loop = !queue.loop;
        } else if(args[0].toLowerCase() == 'on') {
            server.autoplay = true;
        } else if(args[0].toLowerCase() == 'off') {
            server.autoplay = false;
        } else {
            return message.channel.send(`**Usage:** \`${server.prefix}loop <on | off>\` ${message.author}`).catch(console.error);
        }

        return queue.textChannel.send(`🔁 **Loop turned** \`${queue.loop ? "ON" : "OFF"}\``).catch(console.error);
    }
};