const { YOUTUBE_API_KEY } = require("../config.json");
const { createQueue } = require("./create_queue.js");
const { loadAutoplay } = require('./load_autoplay.js');
const { autoplayTimer } = require("../util/timers.js");
const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const ytdlDiscord = require('ytdl-core-discord');
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const english = /^[A-Za-z0-9]*$/;

module.exports = {
	async playQueue(message) {
    	const server = message.client.servers.get(message.guild.id);
    	const queue = server.queue;

		if(queue.seek) { // Seek
    		console.log(`[${message.guild.id}] SEEK ${queue.seek}`);
    		queue.seek = false;
    		queue.playing = true;
    		server.timer = null;
    	} 
    	else if(!queue.songs.length) { 
    		if(server.autoplay && queue.autoSongs.length) { // Autoplay
    			queue.current = queue.autoSongs.shift();
    			queue.auto = true;
    			if(!server.timer) // Start autoplay timer
    				autoplayTimer(server, 900);
    			else if(server.timer == 'done') { // Verify to continue autoplay
    				server.timer = null;
					if(await verifyAutoplay(queue))
						autoplayTimer(server, 900);
					else {
						queue.voiceChannel.leave();
						return;
					}	
 				}
    		} 
    		else { // Stop
    			queue.voiceChannel.leave();
				server.queue = null;
				return;
    		}
    	} 
    	else { // Next
    		server.timer = null;
    		queue.current = queue.songs.shift();
    		queue.auto = false;
    		queue.autoSongs = [];
    	}

    	try {		
    		if(queue.auto) { // Load Autoplay Song
    			console.log(`[${message.guild.id}] LOAD INFO`);
    			let searches;
    			if(english.test(queue.current[0]+' '+queue.current[1])) // Avoid non-english search error
    				searches = await youtube.searchVideos(queue.current[0]+' '+queue.current[1]+' audio', 1);
    			else 
    				searches = await youtube.searchVideos(queue.current[0]+' '+queue.current[1], 1);
				songInfo = await ytdl.getInfo(searches[0].url);
				const queueObject = await createQueue([songInfo], message, queue.voiceChannel);
				queueObject.songs[0].user = 'Autoplay';
				queue.current = queueObject.songs[0];
    		}

			if(queue.current.url.includes('youtube.com')) {
				console.log(`[${message.guild.id}] LOAD FILE`);
				//queue.current.stream = await ytdlDiscord(queue.current.url, { highWaterMark: 1 << 25 });
				queue.current.stream = ytdl(queue.current.url, { highWaterMark: 1 << 25 });
			}

    		let streamType = queue.current.url.includes('youtube.com') ? 'opus' : 'ogg/opus';
			queue.connection.on('disconnect', () => server.queue = null);

			console.log(`[${message.guild.id}] PLAY`);
	    	const dispatcher = queue.connection.play(queue.current.stream, { seek: queue.current.seekTime });	 

	    	dispatcher.on('start', async () => { 
	    		if(server.autoplay) { // Create new autoplay queue
	    			if(queue.auto && queue.autoSongs.length < 3)
	    				loadAutoplay(queue.previous, message);
	    			else if(queue.autoSongs.length < 3)
	    				loadAutoplay(queue.current, message);
	    		}
			});
	    	dispatcher.on('finish', () => { // Seek, loop, or play next song
	    		if(!queue.seek && !queue.auto) {
	    			queue.previous = queue.current;
		    		if(queue.loop) 
						queue.songs.push(queue.current);
				} 
				module.exports.playQueue(message);
			});
			dispatcher.on('error', (err) => { // Error & skip song
				console.error(`[${message.guild.id}] ${err}`);
				message.channel.send(`⚠ **Error:** ${err.message ? err.message : err}`);
				module.exports.playQueue(message);
			});
			dispatcher.setVolumeLogarithmic(server.volume / 100);
		} 
		catch(error) { // Cant play/load song
			console.error(`[${message.guild.id}] ${error}`);
			message.channel.send(`⚠ **Error:** ${error.message ? error.message : error}`);

			module.exports.playQueue(message);		
    	}
	}
};

verifyAutoplay = async (queue) => {
	let result = false;
	let song = queue.current;

	let verifyEmbed = new MessageEmbed()
        .setColor('#1DB954')
        .setTitle('❓  Continue Autoplay?')
        .setDescription('**Up Next:** ' + song[0]+' - '+song[1]);

	let embed = await queue.textChannel.send(verifyEmbed);
	await embed.react('👍');
	await embed.react('👎');

	await embed.awaitReactions((reaction, user) => queue.voiceChannel.members.has(user.id) && (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'), { max: 1, time: 15000 })
		.then(collected => {
            if(collected.first().emoji.name == '👍')
                result = true;
            else 	            	
                queue.textChannel.send(`**👎 Autoplay Ended** (${collected.first().users.cache.last()})`);
	    }).catch(() => {
            queue.textChannel.send('**👎 Ended Autoplay** (No Response)');
		});
	embed.delete();

	return result;
}