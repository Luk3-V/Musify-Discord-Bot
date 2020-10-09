const { MessageEmbed } = require("discord.js");

module.exports = {
	name: 'resume',
	symbol: '▶',
	category: 'basic',
	description: 'Resume the current song.',
	usage: ['resume'],
	execute(message) {
		const server = message.client.servers.get(message.guild.id);
		const queue = server.queue;

		if (!queue || queue.playing) 
			return message.channel.send(`Nothing is paused (${message.author})`).catch(console.error);

		clearTimeout(server.timer);
		queue.playing = true;
		queue.connection.dispatcher.resume();
		
        return queue.textChannel.send('▶ **Resumed**').catch(console.error);
	}
};