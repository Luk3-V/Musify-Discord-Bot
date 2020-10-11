const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

const albumIDPattern = /album\/(.+)\?.+$/;

module.exports = {

	// Get list of songs & album title by spotify url
	// Returns: [ Array<song name, artist>, [title, url] ]
	async getAlbum(message, url, size) {
		let result = [];
		let title = [];
		let albumID = url.match(albumIDPattern)[1];
		if(!albumID)
			return [result, title];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let album = await spotify.getAlbum(albumID);
		let songs = album.body.tracks.items;
		result = songs.map(e => [e.name, e.artists[0].name]).slice(0, size);
		//let songs = await spotify.getAlbumTracks(albumID, {limit: size});
		//result = songs.body.items.map(e => [e.track.name, e.track.artists[0].name]);

		title.push(album.body.name);
		title.push(url);

		return [result, title];
	},

	// Get list of songs & album title from spotify by searching album name
	// Returns: [ Array<song name, artist>, [title, url] ]
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

		return [result, title];
	}
}