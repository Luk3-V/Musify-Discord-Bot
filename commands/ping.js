module.exports = {
	name: 'ping',
	symbol: '🏓',
	description: 'Pings the bot.',
	execute(message) {
		message.channel.send('pong!');
	}
}