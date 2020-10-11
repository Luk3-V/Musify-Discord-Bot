const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

module.exports = {
	
	// Get list of genre seeds from spotify
	// Returns: Array<genre>
	async getGenres() {
		let result = [];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let genres = await spotify.getAvailableGenreSeeds();			
		result = genres.body.genres;

		return result;
	}
}