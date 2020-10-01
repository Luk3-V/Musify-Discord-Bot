module.exports = {
	name: 'ping',
	symbol: '🏓',
	category: 'extra',
	description: 'Pings the bot.',
	execute(message) {
		message.channel.send('pong!');
	}
}