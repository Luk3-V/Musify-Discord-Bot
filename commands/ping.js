module.exports = {
	name: 'ping',
	symbol: '🏓',
	category: 'extra',
	description: 'Pings the bot.',
	usage: ['ping'],
	execute(message) {
		message.channel.send('pong!');
	}
}