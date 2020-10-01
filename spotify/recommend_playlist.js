const { createToken } = require('./token.js');
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const SpotifyAPI = require('spotify-web-api-node');
const spotify = new SpotifyAPI();
let OAuth = 'ACCESS TOKEN';

module.exports = {
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
	}
};


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
                //.setDescription('**Create playlist based on...**')
                .addField(type, items, true)
                //.setFooter('👍 or 👎');

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