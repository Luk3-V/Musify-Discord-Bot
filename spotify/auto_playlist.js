const { createToken } = require('./token.js');
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

module.exports = {
	async autoPlaylist(message, args, size) {
		let result = [];

		OAuth = await createToken();
		spotify.setAccessToken(OAuth);

		let search = null;
		if(!args[1])
			search = await spotify.searchTracks(args[0], {limit: 1});
		else
			search = await spotify.searchTracks(args[0] + ' ' + args[1], {limit: 1});
		if(search.body.tracks.items.length) {
			let seed = [search.body.tracks.items[0].id, search.body.tracks.items[0].artists[0].id];
			let recommened = await spotify.getRecommendations({seed_tracks: seed[0], seed_artists: seed[1], min_popularity: 50, limit: size});
			result = recommened.body.tracks.map(e => [e.name, e.artists[0].name]);
		}

		return result;
	}
}