module.exports = {
	waitTimer(server, time) {
		let timerId = setTimeout(() => {
			console.log(`[${server.guild.id}] LEFT CHANNEL (no repsonse)`);
			server.queue.voiceChannel.leave();
		}, time*1000);

		server.timer = timerId;
	},
	autoplayTimer(server, time) {
		let timerId = setTimeout(async () => {
			console.log(`[${server.guild.id}] AUTOPLAY TIMER`);
			server.timer = 'done';
		}, time*1000);

		server.timer = timerId;
	}
}