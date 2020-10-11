const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
const { searchAlbum, getAlbum } = require('../spotify/spotify_album.js');
const { playQueue } = require("../util/play_queue.js");
const { createQueue } = require("../util/create_queue.js");
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const spotifyAlbum = /^(https?:\/\/)?(open\.)?spotify\.com\/album\/.+$/gi;

module.exports = {
    name: 'album',
    aliases: ['al'],
    symbol: '💽',
    category: 'advanced',
    description: "Play album from Spotify.",
    usage: ['album <Album Name>'],
    async execute(message, args) {
    	const server = message.client.servers.get(message.guild.id);
    	const voiceChannel = message.member.voice.channel;

    	// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`).catch(console.error);

		if(server.queue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`).catch(console.error);

		if(!args.length)
	    	return message.channel.send(`**Usage:** \`${server.prefix}album <Ablum Name>\` (${message.author})`).catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);

	    // Load Album

	    let title;
	    let songs = [];
	    let playlist = [];
		let params = args.join(" ");
		let albumEmbed = new MessageEmbed()
	   		.setColor('#1DB954')
	   		.setAuthor('Created Playlist', message.author.avatarURL());

	    message.channel.send(`**Loading...**`).catch(console.error);

	    if(args.length && spotifyAlbum.test(args[0])) { // Spotify album
			[songs, title] = await getAlbum(message, args[0], MAX_PLAYLIST_SIZE);
			albumEmbed.setTitle(title[0])
		    		.setURL(title[1]);
		} else {
			[songs, title] = await searchAlbum(params, MAX_PLAYLIST_SIZE);
	    	albumEmbed.setTitle(title[0])
		    	.setURL(title[1]);
		}

		if(songs.length) {
	    	try {
		    	const searches = await Promise.all(songs.map(e => youtube.searchVideos(e[0]+' '+e[1]+' audio', 1)));
				playlist = await Promise.all(searches.map(e => ytdl.getInfo(e[0].url)));
			} catch(error) {
				console.error(`[${message.guild.id}] ${error}`);
        		return message.channel.send(`⚠ **Song(s) not found** (${message.author})`).catch(console.error);
			}
	    } else {
	    	return message.channel.send(`⚠ **Album not found** (${message.author})`).catch(console.error);
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
		
		albumEmbed
			.addField('Songs:', songList)
			.setThumbnail(playlist[0].videoDetails.thumbnail.thumbnails[0].url)
			.setFooter(message.client.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

		server.queue.textChannel.send(albumEmbed).catch(console.error);
    }
};