const { YOUTUBE_API_KEY } = require("../../config.json");
const { createQueue } = require("./create_queue.js");
const { loadAutoplay } = require('./load_autoplay.js');
const ytdl = require("ytdl-core");
const ytdlDiscord = require('ytdl-core-discord');
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const english = /^[A-Za-z0-9]*$/;

module.exports = {
	async playQueue(message) {
    	const queue = message.client.queues.get(message.guild.id);

    	if(!queue.songs.length) { // Queue empty
    		if(message.client.autoplay && queue.autoSongs.length) { // Autoplay
    			queue.current = queue.autoSongs.shift();
    			queue.auto = true;
    		} else {
    			queue.voiceChannel.leave();
				message.client.queues.delete(message.guild.id);
				return;
    		}
    	} else {
    		queue.current = queue.songs.shift();
    		queue.auto = false;
    		queue.autoSongs = [];
    	}

    	try { // Load Song		
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

    		let stream = null;
    		let streamType = queue.current.url.includes('youtube.com') ? 'opus' : 'ogg/opus';

    		console.log(`[${message.guild.id}] LOAD FILE`);
			if(queue.current.url.includes('youtube.com')) {
				stream = await ytdlDiscord(queue.current.url, { highWaterMark: 1 << 25 });
			}

			queue.connection.on('disconnect', () => message.client.queues.delete(message.guild.id));
			console.log(`[${message.guild.id}] PLAY`);
	    	const dispatcher = queue.connection.play(stream, { type: streamType });
	    	
	    	dispatcher.on('start', async () => { 
	    		if(message.client.autoplay) { // Create new autoplay queue
	    			if(queue.auto && queue.autoSongs.length < 3)
	    				loadAutoplay(queue.previous, message);
	    			else if(queue.autoSongs.length < 3)
	    				loadAutoplay(queue.current, message);
	    		}
			});
	    	dispatcher.on('finish', () => { // Loop or play next song
	    		if(!queue.auto) {
	    			queue.previous = queue.current;
	    		}
	    		if(queue.loop) {
					queue.songs.push(queue.current);
				}
				module.exports.playQueue(message);
			});
			dispatcher.on('error', (err) => { // Error & skip song
				console.error(`[${message.guild.id}] ${err}`);
				message.channel.send(`⚠ **Error:** ${err.message ? err.message : err}`);
				module.exports.playQueue(message);
			});
			dispatcher.setVolumeLogarithmic(message.client.volume / 100);

		} catch(error) { // Cant Load Song
			console.error(`[${message.guild.id}] ${error}`);
			message.channel.send(`⚠ **Error:** ${error.message ? error.message : error}`);

			module.exports.playQueue(message);		
    	}
	}
};