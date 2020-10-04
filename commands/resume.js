const { MessageEmbed } = require("discord.js");

module.exports = {
	name: 'resume',
	symbol: '▶',
	category: 'basic',
	description: 'Resume the current song.',
	execute(message) {
		const queue = message.client.queues.get(message.guild.id);
		if (!queue || queue.playing) 
			return message.channel.send(`Nothing is paused (${message.author})`).catch(console.error);

		queue.playing = true;
		queue.connection.dispatcher.resume();
		
        return queue.textChannel.send('▶ **Resumed**').catch(console.error);
	}
};