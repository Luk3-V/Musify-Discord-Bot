const { loadAutoplay } = require('../util/load_autoplay.js');

module.exports = {
    name: 'autoplay',
    aliases: ['auto'],
    symbol: '♾️',
    category: 'advanced',
    description: 'Toggle autoplay option.',
    async execute(message, args) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!args.length) {
        	server.autoplay = !message.client.autoplay;
        } else if(args[0].toLowerCase() == 'on') {
            server.autoplay = true;
        } else if(args[0].toLowerCase() == 'off') {
            server.autoplay = false;
        } else {
        	return message.channel.send(`**Usage:** \`${server.prefix}autoplay <on | off>\` (${message.author})`).catch(console.error);
        }

        if(!server.autoplay && queue) { // Clear autoplay queue
            queue.autoSongs = [];
        } else if(queue) { 
            loadAutoplay(queue.current, message);
        }

        return message.channel.send(`♾️  **Autoplay turned** \`${server.autoplay ? "ON" : "OFF"}\``).catch(console.error);
    }
};