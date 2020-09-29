module.exports = {
	async createQueue(songInfo, message, voiceChannel) {
		const serverQueue = message.client.queues.get(message.guild.id);
	    const queueObject = {
			textChannel: message.channel,
			voiceChannel,
			connection: null,
			songs: [],
			autoSongs: [],
			current: null, 
			previous: null,
			auto: false,
	    	loop: false,
			playing: true
		};

	    songInfo.forEach(e => {
	    	let song = {
				title: e.videoDetails.title,
				artist: null,
				url: e.videoDetails.video_url,
				image: e.videoDetails.thumbnail.thumbnails[0].url,
				duration: e.videoDetails.lengthSeconds,
			};
			console.log(`[${message.guild.id}] QUEUED: ` + song.title + '  RESTRICTED=' + e.videoDetails.age_restricted);

			if(e.videoDetails.media.song)
				song.title = e.videoDetails.media.song;
			if(e.videoDetails.media.artist)
				song.artist = e.videoDetails.media.artist.split(/ *, */)[0];

			queueObject.songs.push(song);
	    });

	    return queueObject;
	}
};