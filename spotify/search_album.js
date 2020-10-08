const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

module.exports = {
	async searchAlbum(search, size) {
		let result = [];
		let title = [];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let album = await spotify.searchAlbums(search, {limit: 1});
			album = album.body.albums.items[0];
		let songs = await spotify.getAlbumTracks(album.id, {limit: size});
			
		result = songs.body.items.map(e => [e.name, e.artists[0].name]);

		title.push(album.name);
		title.push(album.external_urls.spotify);

		return [result, title]; // list of songs ([name, artist]) & album title ([name, url])
	}
};