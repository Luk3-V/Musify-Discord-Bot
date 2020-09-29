const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

module.exports = {
	async searchPlaylist(args, size) {
		let result = [];
		let title = [];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let playlist = await spotify.searchPlaylists(args, {limit: 1});
			playlist = playlist.body.playlists.items[0];
		let songs = await spotify.getPlaylistTracks(playlist.id, {limit: size});
			
		result = songs.body.items.map(e => [e.track.name, e.track.artists[0].name]);

		title.push(playlist.name);
		title.push(album.external_urls.spotify);

		return [result, title]; // list of songs ([name, artist]) & playlist title ([name, url])
	}
};