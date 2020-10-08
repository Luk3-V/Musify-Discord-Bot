const fs = require('fs');

module.exports = {
	loadConfig(env) {
		let config = { 
		    TOKEN: env.token,
			YOUTUBE_API_KEY: env.ytAPIKey,
			SPOTIFY_ID: env.spotifyID,
			SPOTIFY_SECRET: env.spotifySecret,
			MAX_PLAYLIST_SIZE: '5',
			PREFIX: '$',
			VERSION: '0.3'
		};
		let data = JSON.stringify(config, null, 2);
		fs.writeFileSync('./config.json', data);
	}
}