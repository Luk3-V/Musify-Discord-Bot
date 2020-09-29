const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
const { createPlaylist } = require('../spotify/create_playlist.js');
const { recommendPlaylist } = require('../spotify/recommend_playlist.js');
const { searchPlaylist } = require('../spotify/search_playlist.js');
const { playQueue } = require("./util/play_queue.js");
const { createQueue } = require("./util/create_queue.js");
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const playlistPattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;

module.exports = {
    name: 'playlist',
    aliases: ['pl'],
    symbol: '🎶',
    description: "Play a playlist from Youtube URL, from artist's top songs, from recommended songs, or from Spotify.",
    async execute(message, args) {
    	const voiceChannel = message.member.voice.channel;
		const serverQueue = message.client.queues.get(message.guild.id);

    	// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`).catch(console.error);

		if(serverQueue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`).catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);

	    // Load Playlist

	   	let playlist = [];
	   	let playlistEmbed = new MessageEmbed()
	   		.setColor('#1DB954')
	   		.setAuthor('Created Playlist', message.author.avatarURL());

	    message.channel.send(`**Loading...**`).catch(console.error);

	    if(args.length && playlistPattern.test(args[0])) { // Youtube playlist
	    	try {
				const search = await youtube.getPlaylist(args[0], { part: 'snippet' });
				playlist = await search.getVideos(MAX_PLAYLIST_SIZE || 10, { part: 'snippet' });
				playlist = await Promise.all(playlist.map(e => ytdl.getInfo(e.url)));
				playlistEmbed.setTitle(search.title)
					.setURL(search.url);
			} catch(error) {
				console.error(error);
				return message.channel.send(`⚠ **No playlist found** (${message.author})`).catch(console.error);
			}
		} else if(args.length >= 2) { // Spotify playlist
			let songs;
			let title;
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
				return message.channel.send(`**Too many arguements, please enter 5 or less** (${message.author})`);
			} else if(args[0] == 'create') {	
		    	[songs, title] = await createPlaylist(params, MAX_PLAYLIST_SIZE);
		    	playlistEmbed.setTitle(title);
		    } else if(args[0] == 'recommend') {
		    	[songs, title] = await recommendPlaylist(message, type, params, MAX_PLAYLIST_SIZE);
		    	playlistEmbed.setTitle(title);
		    } 

		    if(songs.length) {
		    	try {
			    	const searches = await Promise.all(songs.map(e => youtube.searchVideos(e[0]+' '+e[1]+' audio', 1)));
					playlist = await Promise.all(searches.map(e => ytdl.getInfo(e[0].url)));
				} catch(error) {
					console.error(error);
	        		return message.channel.send(`⚠ **Song(s) not found** (${message.author})`).catch(console.error);
				}
		    }
		}

	    if(!playlist.length) {
	    	return message.channel.send(`**Usage:** \`${message.client.prefix}playlist <Youtube URL>\`\n` +
	    								`	**or** \`${message.client.prefix}playlist create artist=<Artist1, Artist2, ...>\`\n` +
	    								`	**or** \`${message.client.prefix}playlist recommend song=<Song1, Song2, ...>\`\n` +
	    								`	**or** \`${message.client.prefix}playlist recommend artist=<Artist1, Artist2, ...>\`\n` +
	    								`	**or** \`${message.client.prefix}playlist recommend genre=<Genre1, Genre2, ...>\`\n` +
	    								`	**or** \`${message.client.prefix}playlist search <Spotify Playlist>\` (${message.author})`).catch(console.error);
	    }

	    // Queue Songs

	    const queueObject = await createQueue(playlist, message, voiceChannel);

		if(!serverQueue) {
			message.client.queues.set(message.guild.id, queueObject);

			try { 
				queueObject.connection = await voiceChannel.join();
				await queueObject.connection.voice.setSelfDeaf(true);
				playQueue(message);
		    } catch(error) {
				console.error(error);
				message.client.queues.delete(message.guild.id);
				await voiceChannel.leave();
				return message.channel.send(`⚠ **Can't join channel:** ${error}`).catch(console.error);
		    }
		} else {
			serverQueue.songs.push(...queueObject.songs);
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
			.setFooter(message.client.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

		message.channel.send(playlistEmbed).catch(console.error);   
    }
};

// TODO: 
// playlist size <1-20>