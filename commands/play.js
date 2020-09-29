const { YOUTUBE_API_KEY } = require("../config.json");
const { playQueue } = require("./util/play_queue.js");
const { createQueue } = require("./util/create_queue.js");
const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);	  

const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;

module.exports = {
	name: 'play',
	aliases: ['p'],
	symbol: '🎶',
	description: 'Plays a song given YouTube link or video name.',
	async execute(message, args) {
		const voiceChannel = message.member.voice.channel;
		const serverQueue = message.client.queues.get(message.guild.id);

		// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`)
				.catch(console.error);

		if(serverQueue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`)
				.catch(console.error);

		if(!args.length)
	    	return message.channel.send(`**Usage:** \`${message.client.prefix}play <YouTube URL | Video Name>\` (${message.author})`)
	  			.catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);
	
		// Load Song

		let songInfo = null;

	    if(!videoPattern.test(args[0]) && playlistPattern.test(args[0])) { // Youtube playlist url
			return message.client.commands.get('playlist').execute(message, args);
		} 

		if(videoPattern.test(args[0])) { // Youtube video url
	    	try {
	        	songInfo = await ytdl.getInfo(args[0]);
	      	} catch(error) {
	        	console.error(error);
	        	return message.channel.send(`⚠ **Error:** ${error.message} (${message.author})`).catch(console.error);
	      	}
	    } else {
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

	    if(serverQueue) { // Queue already exists
	    	serverQueue.songs.push(song);

	    	let songEmbed = new MessageEmbed()
                .setColor('#1DB954')
                .setAuthor('Added to Queue', message.author.avatarURL())
                .setThumbnail(song.image)
                .setDescription(`[**${song.title}**](${song.url})`)
                .setFooter(message.client.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

            return serverQueue.textChannel.send(songEmbed).catch(console.error);
	    }

    	message.client.queues.set(message.guild.id, queueObject);

    	try { // Join & start queue
			queueObject.connection = await voiceChannel.join();
			await queueObject.connection.voice.setSelfDeaf(true);
			playQueue(message);
			let songEmbed = new MessageEmbed()
                .setColor('#1DB954')
                .setTitle('🎶  Now Playing')
                .setThumbnail(song.image)
                .setDescription(`[**${song.title}**](${song.url})`)
               	.setFooter(message.client.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

            message.channel.send(songEmbed).catch(console.error);
	    } catch(error) {
			console.error(error);
			message.client.queues.delete(message.guild.id);
			await voiceChannel.leave();
			return message.channel.send(`⚠ **Can't join channel:** ${error}`).catch(console.error);
	    }
	}
}