const { SPOTIFY_ID, SPOTIFY_SECRET } = require('../config.json');
const $ = require('jquery');
const URL = 'https://api.spotify.com/v1';
let OAuth = 'ACCESS TOKEN';

module.exports = {
	async loadToken() {
		const result = await $.ajax({
			method: "POST",
			url: "https://accounts.spotify.com/api/token",
			timeout: 0,
			headers: {
		        'Content-Type' : 'application/x-www-form-urlencoded', 
		        'Authorization' : 'Basic ' + btoa(SPOTIFY_ID + ':' + SPOTIFY_SECRET)
		    },
		    data: {
		    	"grant_type": "client_credentials"
		    },
		    success: (data) => data.access_token
		});

		//console.log(result);
		OAuth = result.access_token;
	},

	async searchArtist(name) {
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/search`,
			timeout: 0,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
			data: {
				type: 'artist',
				q: name
			},
			success: (data) => data
		});

		console.log(result);
		return result.artists.items[0];
	},

	async searchSong(name) {
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/search`,
			timeout: 0,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
			data: {
				type: 'track',
				q: name
			},
			success: (data) => data
		});

		console.log(result);
		return result.tracks.items[0];
	},

	async searchPlaylist(name) {
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/search`,
			timeout: 0,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
			data: {
				type: 'playlist',
				q: name
			},
			success: (data) => data
		});

		console.log(result);
		return result.playlists.items[0];
	},

	async getAlbums(id) {
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/artists/${id}/albums?limit=50`,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
		    success: (data) => data
		});

		//console.log(result);
		return result.items;
	},

	async getAlbumSongs(id) {
		if(Array.isArray(id)) {	
			const result = await $.ajax({ // For multiple albums (MAX 20)
				method: 'GET',
				url: `${URL}/albums?ids=${id.toString()}`,
				headers: {
					'Accept': 'application/json',
			        'Content-Type': 'application/json', 
			        'Authorization': 'Bearer ' + OAuth,
			    },
			    success: (data) => data
			});

			console.log(result);
			return result.albums; // Array of albums w/ songs inside
		} 
		
		const result = await $.ajax({ // For single Album
			method: 'GET',
			url: `${URL}/albums/${id}/tracks`,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
		    success: (data) => data
		});

		//console.log(result);
		return result.items;
	},

	async getPlaylistSongs(id) {	
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/playlists/${id}/tracks`,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
		    success: (data) => data
		});

		console.log(result);
		return result.items;
	},

	async getSongInfo(id) {
		if(Array.isArray(id)) {	
			const result = await $.ajax({ // For multiple songs (MAX 50)
				method: 'GET',
				url: `${URL}/tracks?ids=${id.toString()}`,
				headers: {
					'Accept': 'application/json',
			        'Content-Type': 'application/json', 
			        'Authorization': 'Bearer ' + OAuth,
			    },
			    success: (data) => data
			});

			//console.log(result);
			return result.tracks; // Array of info for each song
		} 

		const result = await $.ajax({ // For single song
			method: 'GET',
			url: `${URL}/tracks/${id}`,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
		    success: (data) => data
		});

		//console.log(result);
		return result;
	},

	async recommendBySong(songID, artistID, amount) {
		const result = await $.ajax({
			method: 'GET',
			url: `${URL}/recommendations`,
			timeout: 0,
			headers: {
				'Accept': 'application/json',
		        'Content-Type': 'application/json', 
		        'Authorization': 'Bearer ' + OAuth,
		    },
		    data: {
		    	seed_tracks: songID,
		    	seed_artists: artistID,
		    	limit: amount,
		    	min_popularity: 50
		    },
		    success: (data) => data
		});

		//console.log(result);
		return result.tracks;
	}
};