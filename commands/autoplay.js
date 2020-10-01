const { loadAutoplay } = require('./util/load_autoplay.js');

module.exports = {
    name: 'autoplay',
    aliases: ['auto'],
    symbol: '♾️',
    category: 'advanced',
    description: 'Toggle autoplay option.',
    async execute(message, args) {
        const queue = message.client.queues.get(message.guild.id);

        if(!args.length) {
        	message.client.autoplay = !message.client.autoplay;
        } else if(args[0].toLowerCase() == 'on') {
            message.client.autoplay = true;
        } else if(args[0].toLowerCase() == 'off') {
            message.client.autoplay = false;
        } else {
        	return message.channel.send(`**Usage:** \`${message.client.prefix}autoplay <on | off>\` (${message.author})`).catch(console.error);
        }

        if(!message.client.autoplay && queue) { // Clear autoplay queue
            queue.autoSongs = [];
        } else if(queue) { 
            loadAutoplay(queue.current, message);
        }

        return message.channel.send(`♾️  **Autoplay turned** \`${message.client.autoplay ? "ON" : "OFF"}\``).catch(console.error);
    }
};