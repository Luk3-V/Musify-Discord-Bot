const { MAX_PLAYLIST_SIZE } = require("../../config.json");
const { autoPlaylist } = require('../../spotify/auto_playlist.js');

module.exports = {
	async loadAutoplay(song, message) {
		const serverQueue = message.client.queues.get(message.guild.id);

		let playlist = [];
		let songs;

		console.log(`[${message.guild.id}] LOAD AUTOPLAY: ${song.title}`);
		playlist = await autoPlaylist(message, [song.title, song.artist], 3);	

	    if(!playlist.length) {
	    	console.error(`[${message.guild.id}] Error w/ Autoplay!`);
	    	return;
	    }

	    serverQueue.autoSongs.push(...playlist);
	    console.log(`[${message.guild.id}] AUTOPLAY SONGS:\n${serverQueue.autoSongs.map(e => '\t'+e[0]+' - '+e[1]).join('\n')}`);

	    return; 
	}
};