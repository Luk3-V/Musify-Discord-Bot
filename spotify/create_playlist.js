const { createToken } = require('./token.js');
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
//{clientId: SPOTIFY_ID, clientSecret: SPOTIFY_SECRET}
let OAuth = 'ACCESS TOKEN';

module.exports = {
	async createPlaylist(args, size) {
		let result = [];
		let title = '';

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);
		
		let artists = await Promise.all(args.map(e => spotify.searchArtists(e, {limit: 1})));
		let playlists = await Promise.all(artists.map(e => artistPlaylist(e.body.artists.items[0], size/args.length)));
		playlists.forEach(artist => artist.forEach(e => result.push([e[0], e[1]])));
		console.log(playlists);

		title = createTitle(artists);

		return [result, title]; // list of songs ([name, artist]) & playlist title
	}
};

// Returns a title for the playlist
createTitle = (artists) => {
	if(artists.length == 1) 
		return artists[0].body.artists.items[0].name;

	let title = '';	
	let i;
	for(i = 0; i < artists.length-1; i++) {
		title += artists[i].body.artists.items[0].name + ', ';
	}
	title += '& ' + artists[i].body.artists.items[0].name;

	return title;
}

// Returns a playlist of artists top songs using the Spotify API ([name, artist, id, popularity])
artistPlaylist = async (artist, amount) => {
	spotify.setAccessToken(OAuth);

	let result = [];
	let keys = [];
	if(result.length < amount) {
		let albums = await spotify.getArtistAlbums(artist.id, {limit: 50});
			albums = albums.body.items;
		let songs = await getTopSongs(albums, amount);
		let i = 0;

		while(result.length < amount && songs.length > i) {
			if(!keys.includes(songs[i][0])) {
				result.push([songs[i][0], artist.name, songs[i][1], songs[i][2]]);
			}
			i++;
		}
	}

	result = result.slice(0, amount);
	return result;
};

// Get top n songs from artist
getTopSongs = async (albums, n) => {
	let unsorted = await songsFromAlbums(albums);

	// Remove duplicates w/ lower popularity
	let sorted = {};
	unsorted.forEach((e) => {
		let key = getSongKey(sorted, e[0]);
		if(typeof key == 'undefined') {
			sorted[e[0]] = [e[1], e[2]];
		}
		else if(sorted[key][1] < e[2]) {
			//console.log(e[0] + " " + e[2] + " > " + key + " " + sorted[key][1]);
			delete sorted[key];
			sorted[e[0]] = [e[1], e[2]];
		}
		//else {console.log(key + " " + sorted[key][1] + " > " + e[0] + " " + e[2]);}
	});

	// Sort by popularity
	let result = Object.keys(sorted).map(key => [key, sorted[key][0], sorted[key][1]]);
	result.sort((a, b) => b[2] - a[2]);
	
	//console.log(result);
	return result.slice(0, n);
};

// Returns list of songs as [name, id, popularity] from a list of albums
songsFromAlbums = async (albums) => {
	let albumIDs = albums.map(e => e.id);

	let songIDs = [];
	while(albumIDs.length > 0) {
		let temp = await spotify.getAlbums(albumIDs.slice(0, 20));
			temp = temp.body.albums;
		temp.forEach(e => {
			temp = e.tracks.items.map(song => song.id);
			songIDs.push(...temp);
		});
		albumIDs = albumIDs.slice(20);
	}
	
	let result = [];
	while(songIDs.length > 0) {
		let temp = await spotify.getTracks(songIDs.slice(0, 50));
			temp = temp.body.tracks;
		temp.forEach(e => {
			result.push([e.name, e.id, e.popularity]);
		});
		songIDs = songIDs.slice(50);
	}

	return result;
};

// Returns song key that is a version equal to str 
// Or undifined if no key
getSongKey = (dict, str) => {
	let keys = Object.keys(dict);

	if(isSongVersion(str)) { // Simplify str
		str = (str.includes(" (")) ? str.substring(0, str.indexOf(" (")) : str.substring(0, str.lastIndexOf(" - "));
	}
	k = keys.find(e => { 
		if(isSongVersion(e)) { // Simplify key
			e = (e.includes(" (")) ? e.substring(0, e.indexOf(" (")) : e.substring(0, e.lastIndexOf(" - "));
		} 
		return e.toLowerCase() === str.toLowerCase();
	});

	return k;
};

// Returns if song is a type of song version
isSongVersion = (str) => {
	const versions = [' version', ' remix', ' radio edit', ' commentary', ' mix', ' live', ' bonus track', ' remaster', ' instrumental', ' feat.',
						'(remix', '(feat. ', '(w/ ', '(radio edit', '(commentary', '(live', '(bonus track)', '(remaster', '(instrumental'];
	const excluded = [' pt. ', ' part ', '(pt. ', '(part ', ' pts. ', '(pts. '];
	if(str.includes(" - ") || str.includes(" (")) {
		let temp = (str.includes(" (")) ? str.substring(str.indexOf(" (")) : str.substring(str.lastIndexOf(" - "));
		for(i in excluded) {
			if(temp.toLowerCase().includes(excluded[i])) {
				return false;
			} 
		}
		for(i in versions) {
			if(temp.toLowerCase().includes(versions[i])) {
				return true;
			} 
		}
	}
	return false;
};