const { YOUTUBE_API_KEY } = require("../config.json");
const { playQueue } = require("../util/play_queue.js");
const { createQueue } = require("../util/create_queue.js");
const { getSong } = require("../spotify/spotify_song.js");
const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);	  

const youtubePattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
const spotifyPattern = /^(https?:\/\/)?(open\.)?spotify\.com\/.+$/gi;
const youtubePlaylist = /^.*(list=)([^#\&\?]*).*/gi;
const spotifyPlaylist = /^.*\/playlist\/.*/gi;
const spotifyAlbum = /^.*\/album\/.*/gi;

module.exports = {
	name: 'play',
	aliases: ['p'],
	symbol: '🎶',
	category: 'basic',
	description: 'Plays a song or playlist given YouTube URL, Spotify URL, or video name.',
	usage: ['play <URL | Video Name>'],
	async execute(message, args) {
		const server = message.client.servers.get(message.guild.id);
		const voiceChannel = message.member.voice.channel;

		// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`)
				.catch(console.error);

		if(server.queue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`)
				.catch(console.error);

		if(!args.length)
	    	return message.channel.send(`**Usage:** \`${server.prefix}play <YouTube URL | Spotify URL>\`\n` +
	    								`\t\t**or** \`${server.prefix}play <Video Name>\` (${message.author})`).catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);
	
		// Load Song

		let songInfo = null;

		const ytSong = youtubePattern.test(args[0]);
		const spSong = spotifyPattern.test(args[0]); 
		const ytPlaylist = youtubePattern.test(args[0]) && youtubePlaylist.test(args[0]);
		const spPlaylist = spotifyPattern.test(args[0]) && spotifyPlaylist.test(args[0]);
		const spAlbum = spotifyPattern.test(args[0]) && spotifyAlbum.test(args[0]);

	    if(ytPlaylist) { // Youtube playlist url
			return message.client.commands.get('playlist').execute(message, args);
		} 
		if(spPlaylist) { // Spotify playlist url
			return message.client.commands.get('playlist').execute(message, args);
		} 
		if(spAlbum) { // Spotify album url
			return message.client.commands.get('album').execute(message, args);
		}

		if(ytSong) { // Youtube video url
	    	try {
	        	songInfo = await ytdl.getInfo(args[0]);
	      	} catch(error) {
	        	console.error(error);
	        	return message.channel.send(`⚠ **Error:** ${error.message} (${message.author})`).catch(console.error);
	      	}
	    } else if(spSong) { // Spotify song url 
	    	const spfySong = await getSong(message, args[0]);
	    	if(!spfySong)
	        	return message.channel.send(`⚠ **No song found** (${message.author})`).catch(console.error);
	    	try {
	        	const search = await youtube.searchVideos(spfySong[0]+' '+spfySong[1]+' audio', 1);
	        	songInfo = await ytdl.getInfo(search[0].url);
	    	} catch(error) {
	        	console.error(error);
	        	return message.channel.send(`⚠ **No song found** (${message.author})`).catch(console.error);
	    	}
	    } else { // Search
	    	try {
	        	const search = await youtube.searchVideos(args.join(/ +/), 1);
	        	songInfo = await ytdl.getInfo(search[0].url);
	    	} catch(error) {
	        	console.error(error);
	        	return message.channel.send(`⚠ **No song found** (${message.author})`).catch(console.error);
	    	}
	    }

	    // Queue Song

	   	const queueObject = await createQueue([songInfo], message, voiceChannel);
	   	const song = queueObject.songs[0];

	    if(server.queue) { // Queue already exists
	    	server.queue.songs.push(song);

	    	let songEmbed = new MessageEmbed()
                .setColor('#1DB954')
                .setAuthor('Added to Queue', message.author.avatarURL())
                .setThumbnail(song.image)
                .setDescription(`[**${song.title}**](${song.url})`)
                .addField('Channel:', song.channel, true)
                .addField('Duration:', (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '')), true)
                .setFooter(server.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

            return server.queue.textChannel.send(songEmbed).catch(console.error);
	    }

    	server.queue = queueObject;

    	try { // Join & start queue
			queueObject.connection = await voiceChannel.join();
			await queueObject.connection.voice.setSelfDeaf(true);
			playQueue(message);
			let songEmbed = new MessageEmbed()
                .setColor('#1DB954')
                .setTitle('🎶  Now Playing')
                .setThumbnail(song.image)
                .setDescription(`[**${song.title}**](${song.url})`)
                .addField('Channel:', song.channel, true)
                .addField('Duration:', (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8).replace(/^(0|:){1,4}/, '')), true)
               	.setFooter(server.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

            message.channel.send(songEmbed).catch(console.error);
	    } catch(error) {
			console.error(`[${message.guild.id}] ${error}`);
			server.queue = null;
			await voiceChannel.leave();
			return message.channel.send(`⚠ **Can't join channel:** ${error}`).catch(console.error);
	    }
	}
}