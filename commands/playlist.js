const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
const { getPlaylist, searchPlaylist, createPlaylist, recommendPlaylist } = require('../spotify/spotify_playlist.js');
const { playQueue } = require("../util/play_queue.js");
const { createQueue } = require("../util/create_queue.js");
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const youtubePlaylist = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
const spotifyPlaylist = /^(https?:\/\/)?(open\.)?spotify\.com\/playlist\/.+$/gi;

module.exports = {
    name: 'playlist',
    aliases: ['pl'],
    symbol: '🎶',
    category: 'advanced',
    description: "Play a playlist from Youtube URL, Spotify URL, artist's top songs, recommended songs, or Spotify search.",
    usage: ['playlist <URL>', 'playlist search <Spotify Playlist>', 'playlist create artist=[Artist1, Artist2, ...]', 'playlist recommend song=[Song1, Song2, ...]', 
    'playlist recommend artist=[Artist1, Artist2, ...]', 'playlist recommend genre=[Genre1, Genre2, ...]'],
    async execute(message, args) {
    	const server = message.client.servers.get(message.guild.id);
    	const voiceChannel = message.member.voice.channel;

    	// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`).catch(console.error);

		if(server.queue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`).catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);

	    // Load Playlist

	    let title;
	    let songs = [];
	   	let playlist = [];
	   	let playlistEmbed = new MessageEmbed()
	   		.setColor('#1DB954')
	   		.setAuthor('Created Playlist', message.author.avatarURL());

	    message.channel.send(`**Loading...**`).catch(console.error);

	    if(args.length && youtubePlaylist.test(args[0])) { // Youtube playlist
	    	try {
				const search = await youtube.getPlaylist(args[0], { part: 'snippet' });
				playlist = await search.getVideos(MAX_PLAYLIST_SIZE || 10, { part: 'snippet' });
				playlist = await Promise.all(playlist.map(e => ytdl.getInfo(e.url)));
				playlistEmbed.setTitle(search.title)
					.setURL(search.url);
			} catch(error) {
				console.error(`[${message.guild.id}] ${error}`);
				return message.channel.send(`⚠ **No playlist found** (${message.author})`).catch(console.error);
			}
		} else if(args.length && spotifyPlaylist.test(args[0])) { // Spotify playlist
			[songs, title] = await getPlaylist(message, args[0], MAX_PLAYLIST_SIZE);
			playlistEmbed.setTitle(title[0])
		    		.setURL(title[1]);
		} else if(args.length >= 2) { // Create playlist
			let type;
			let params = args.slice(1).join(" ");

			if(args[0] == 'search') { 
		    	[songs, title] = await searchPlaylist(params, MAX_PLAYLIST_SIZE);
		    	playlistEmbed.setTitle(title[0])
		    		.setURL(title[1]);
		    }

		    params = params.split(/ *= */);
		    type = params[0];
		    params = params[1].split(/ *, */);

			if(params.length > 6) {
				return message.channel.send(`**Too many \`${type}\` arguements, please enter 5 or less** (${message.author})`);
			} else if(args[0] == 'create') {	
		    	[songs, title] = await createPlaylist(params, MAX_PLAYLIST_SIZE);
		    	playlistEmbed.setTitle(title);
		    } else if(args[0] == 'recommend') {
		    	[songs, title] = await recommendPlaylist(message, type, params, MAX_PLAYLIST_SIZE);
		    	playlistEmbed.setTitle(title);
		    } 

		    if(title == 'genre-error') {
		    	return message.channel.send(`No matching genres. Use \`${message.client.prefix}spotify genres\` to see valid genres (${message.author})`);
		    }
		}

		if(songs.length) {
	    	try {
		    	const searches = await Promise.all(songs.map(e => youtube.searchVideos(e[0]+' '+e[1]+' audio', 1)));
				playlist = await Promise.all(searches.map(e => ytdl.getInfo(e[0].url)));
			} catch(error) {
				console.error(`[${message.guild.id}] ${error}`);
        		return message.channel.send(`⚠ **Song(s) not found** (${message.author})`).catch(console.error);
			}
	    }
	    if(!playlist.length) {
	    	return message.channel.send(`**Usage:** \`${server.prefix}playlist <Youtube URL | Spotify URL>\`\n` +
	    								`\t\t**or** \`${server.prefix}playlist search <Spotify Playlist>\`\n` +
	    								`\t\t**or** \`${server.prefix}playlist create artist=[Artist1, Artist2, ...]\`\n` +
	    								`\t\t**or** \`${server.prefix}playlist recommend song=[Song1, Song2, ...]\`\n` +
	    								`\t\t**or** \`${server.prefix}playlist recommend artist=[Artist1, Artist2, ...]\`\n` +
	    								`\t\t**or** \`${server.prefix}playlist recommend genre=[Genre1, Genre2, ...]\`\n (${message.author})`).catch(console.error);
	    }

	    // Queue Songs

	    const queueObject = await createQueue(playlist, message, voiceChannel);

		if(!server.queue) {
			server.queue = queueObject;

			try { 
				queueObject.connection = await voiceChannel.join();
				await queueObject.connection.voice.setSelfDeaf(true);
				playQueue(message);
		    } catch(error) {
				console.error(`[${message.guild.id}] ${error}`);
				server.queue = null;
				await voiceChannel.leave();
				return message.channel.send(`⚠ **Can't join channel:** ${error}`).catch(console.error);
		    }
		} else {
			server.queue.songs.push(...queueObject.songs);
		}
		
		let songList = [];
		let charLength = 0;
		for(let i = 0; i < playlist.length; i++) {
			songList.push(`${i + 1}. [${escapeMarkdown(playlist[i].videoDetails.title)}](${playlist[i].videoDetails.video_url})`);
			charLength += songList[i].length;

			if(charLength >= 1000) {
				songList = songList.slice(0, i);
				songList.push(`... ${playlist.slice(i).length} more`);
				break;
			}
		}
		
		playlistEmbed
			.addField('Songs:', songList)
			.setThumbnail(playlist[0].videoDetails.thumbnail.thumbnails[0].url)
			.setFooter(server.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

		server.queue.textChannel.send(playlistEmbed).catch(console.error);   
    }
};