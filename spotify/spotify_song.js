const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

const songIDPattern = /track\/(.+)\?.+$/;

module.exports = {
	async spotifySong(message, url) {
		let result = [];
		let songID = url.match(songIDPattern)[1];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let song = await spotify.getTrack(songID);
		result = [song.body.name, song.body.artists[0].name];

		return result; // song ([name, artist])
	}
};