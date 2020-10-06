module.exports = {
	waitTimer(server, time) {
		let timerId = setTimeout(() => {
			console.log(`[${server.guild.id}] LEFT CHANNEL (no repsonse)`);
			server.queue.voiceChannel.leave();
		}, time*1000);

		server.timer = timerId;
	}
}