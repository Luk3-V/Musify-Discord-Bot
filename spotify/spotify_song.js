const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

const songIDPattern = /track\/(.+)\?.+$/;

module.exports = {
	
	// Get spotify song by spotify url
	// Returns: [name, artist]
	async getSong(message, url) {
		let result = [];
		let songID = url.match(songIDPattern)[1];
		if(!songID)
			return null;

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let song = await spotify.getTrack(songID);
		result = [song.body.name, song.body.artists[0].name];

		return result;
	}
};