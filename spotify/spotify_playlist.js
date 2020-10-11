const { createToken } = require('./token.js');
const { MessageEmbed } = require("discord.js");
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

const playlistIDPattern = /playlist\/(.+)\?.+$/;

module.exports = {
	
	// Get list of songs & playlist title by spotify url
	// Returns: [ Array<song name, artist>, [title, url] ]
	async getPlaylist(message, url, size) {
		let result = [];
		let title = [];
		let playlistID = url.match(playlistIDPattern)[1];
		if(!playlistID)
			return [result, title];

		OAuth = await createToken();	
		spotify.setAccessToken(OAuth);

		let playlist = await spotify.getPlaylist(playlistID);
		let songs = playlist.body.tracks.items;
		console.log(songs);
		result = songs.map(e => [e.track.name, e.track.artists[0].name]).slice(0, size);;
		//let songs = await spotify.getPlaylistTracks(playlistID, {limit: size});
		//result = songs.body.items.map(e => [e.track.name, e.track.artists[0].name]);

		title.push(playlist.body.name);
		title.push(url);

		return [result, title];
	},

	// Get list of songs & playlist title from spotify by searching playlist name
	// Returns: [ Array<song name, artist>, [title, url] ]
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

		return [result, title];
	},

	// Create list of each artist's top songs & playlist title by list of artist names
	// Returns: [ Array<song name, artist>, title ]
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
	},

	// Create list of recommended songs & playlist title by list of <artist names | song names | genres>
	// Requires user to verify seeds
	// Returns: [ Array<song name, artist>, title ]
	async recommendPlaylist(message, type, args, size) {
		let result = [];
		let title = 'Recommended Playlist';

		OAuth = await createToken();
		spotify.setAccessToken(OAuth);

		if(type.toLowerCase() == 'song' || type.toLowerCase() == 'songs') {
			let search = await Promise.all(args.map(e => spotify.searchTracks(e, {limit: 1})));
			let seeds = [];
			if(await verifySearch(message, search.map(e => e.body.tracks.items[0].name + ' - ' + e.body.tracks.items[0].artists[0].name), 'Songs:')) {
				seeds = search.map(e => e.body.tracks.items[0].id);
				let recommened = await spotify.getRecommendations({seed_tracks: seeds, min_popularity: 50, limit: size});
				result = recommened.body.tracks.map(e => [e.name, e.artists[0].name]);
			}
		} 
		else if(type.toLowerCase() == 'artist' || type.toLowerCase() == 'artists') {
			let search = await Promise.all(args.map(e => spotify.searchArtists(e, {limit: 1})));
			let seeds = [];
			if(await verifySearch(message, search.map(e => e.body.artists.items[0].name), 'Artists:')) {
				seeds = search.map(e => e.body.artists.items[0].id);
				let recommened = await spotify.getRecommendations({seed_artists: seeds, min_popularity: 50, limit: size});
				result = recommened.body.tracks.map(e => [e.name, e.artists[0].name]);
			}
		} 
		else if(type.toLowerCase() == 'genre' || type.toLowerCase() == 'genres') {
			let genres = await spotify.getAvailableGenreSeeds();
			let seeds = await Promise.all(args.map(e => (genres.body.genres.includes(e.toLowerCase()) ? e.toLowerCase() : null)));
			console.log(seeds);
			seeds = seeds.filter((e) => e);
			console.log(seeds);
			if(seeds.length) {
				if(await verifySearch(message, seeds, 'Genres:')) {
					let recommened = await spotify.getRecommendations({seed_genres: seeds, min_popularity: 50, limit: size});
					result = recommened.body.tracks.map(e => [e.name, e.artists[0].name]);
				}
			} else {
				title = 'genre-error';
			}
		}

		return [result, title];
	},

	// Create list of songs recommended by song name & artist
	// Returns: [ Array<song name, artist> ]
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
};

// ------------------------------------------------------------- Playlist Utility -------------------------------------------------------------

// Verify seeds for recommended playlist
verifySearch = async (message, items, type) => {
	let result = false;

	let charLength = 0;
	for(let i = 0; i < items.length; i++) {
		charLength += items[i].length;

		if(charLength >= 1000) {
			let excluded = items.slice(i).length
			items.slice(0, i);
			items.push(`... ${excluded} more`);
			break;
		}
	}

	let verifyEmbed = new MessageEmbed()
                .setColor('#1DB954')
                .setTitle('❓  Verify Input')
                .addField(type, items, true)

	let embed = await message.channel.send(verifyEmbed);
	await embed.react('👍');
	await embed.react('👎');

	await embed.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'), { max: 1, time: 15000 })
		.then(collected => {
	            if (collected.first().emoji.name == '👍') {
                    message.channel.send('**👍 Creating...**');
                    result = true;
	            } else 	            	
                    message.channel.send('**👎 Canceled**');
	    }).catch(() => {
	            message.channel.send('**👎 Canceled**');
		});
	embed.delete();

	return result;
}

// Returns a title for the playlist given artist names
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