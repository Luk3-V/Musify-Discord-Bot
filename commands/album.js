const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
const { searchAlbum } = require('../spotify/search_album.js');
const { playQueue } = require("./util/play_queue.js");
const { createQueue } = require("./util/create_queue.js");
const { MessageEmbed, escapeMarkdown } = require("discord.js");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
    name: 'album',
    aliases: ['al'],
    symbol: '💽',
    description: "Play album from Spotify.",
    async execute(message, args) {
    	const voiceChannel = message.member.voice.channel;
		const serverQueue = message.client.queues.get(message.guild.id);

    	// Error Handling

		if(!voiceChannel) 
			return message.channel.send(`**You need to join a voice channel first** (${message.author})`).catch(console.error);

		if(serverQueue && voiceChannel !== message.guild.me.voice.channel) 
			return message.channel.send(`**You must be in the same channel as** ${message.client.user} (${message.author})`).catch(console.error);

		if(!args.length)
	    	return message.channel.send(`**Usage:** \`${message.client.prefix}album <Ablum Name>\` (${message.author})`).catch(console.error);

	  	const permissions = voiceChannel.permissionsFor(message.client.user);
	    if(!permissions.has("CONNECT"))
	    	return message.channel.send(`⚠ **Cannot connect to voice channel, missing permissions!**`);
	    if(!permissions.has("SPEAK"))
	    	return message.channel.send(`⚠ **Cannot speak in voice channel, missing permissions!**`);

	    // Load Album

	    let playlist;
	    let songs;
		let title;
		let params = args.join(" ");
		let albumEmbed = new MessageEmbed()
	   		.setColor('#1DB954')
	   		.setAuthor('Created Playlist', message.author.avatarURL());

	    message.channel.send(`**Loading...**`).catch(console.error);

	    [songs, title] = await searchAlbum(params, MAX_PLAYLIST_SIZE);
	    albumEmbed.setTitle(title[0])
		    .setURL(title[1]);

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

		if(!serverQueue) {
			message.client.queues.set(message.guild.id, queueObject);

			try { 
				queueObject.connection = await voiceChannel.join();
				await queueObject.connection.voice.setSelfDeaf(true);
				playQueue(message);
		    } catch(error) {
				console.error(`[${message.guild.id}] ${error}`);
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
		
		albumEmbed
			.addField('Songs:', songList)
			.setThumbnail(playlist[0].videoDetails.thumbnail.thumbnails[0].url)
			.setFooter(message.client.autoplay ? `Autoplay : ON` : `Autoplay : OFF`);

		message.channel.send(albumEmbed).catch(console.error);
    }
};

// album <name>