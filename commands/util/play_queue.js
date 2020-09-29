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
				console.error(err);
				message.channel.send(`⚠ **Error:** ${err.message ? err.message : err}`);
				module.exports.playQueue(message);
			});
			dispatcher.setVolumeLogarithmic(message.client.volume / 100);

		} catch(error) { // Cant Load Song
			console.error(error);
			message.channel.send(`⚠ **Error:** ${error.message ? error.message : error}`);

			module.exports.playQueue(message);		
    	}
	}
};

// TODO:

// FIX ERROR WITH MATURE CONTENT VIDEO
// HAD TO EDIT info.js:56 ON ytdl-core-discord

// FIX BOT FREEZING WHEN SKIPPING AUTO PLAY SONG
/*HTTPError [AbortError]: The user aborted a request.
    at RequestHandler.execute (C:\Users\lukev\Desktop\Discord Music Bot\node_modules\discord.js\src\rest\RequestHandler.js:107:21)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)
    at runNextTicks (internal/process/task_queues.js:66:3)
    at processTimers (internal/timers.js:489:9) {
  code: 500,
  method: 'post',
  path: '/channels/501188122990870530/messages'
}
*/

// FIX RANDOM URL ERROR
/*TypeError [ERR_INVALID_ARG_TYPE]: The "url" argument must be of type string. Received undefined
    at validateString (internal/validators.js:120:11)
    at Url.parse (url.js:159:3)
    at urlParse (url.js:154:13)
    at Url.resolve (url.js:667:29)
    at Object.urlResolve [as resolve] (url.js:663:40)
    at exports.getFullInfo (C:\Users\lukev\Desktop\Discord Music Bot\node_modules\ytdl-core-discord\node_modules\ytdl-core\lib\info.js:197:32)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)
    at async Object.exports.<computed> [as getFullInfo] (C:\Users\lukev\Desktop\Discord Music Bot\node_modules\ytdl-core-discord\node_modules\ytdl-core\lib\info.js:298:18) {
  code: 'ERR_INVALID_ARG_TYPE'
}
*/


// MAYBE FIXED:

//Error: FFmpeg/avconv not found!
//Error: FFmpeg/avconv not found!
/*internal/modules/cjs/loader.js:968
  throw err;
  ^

Error: Cannot find module 'C:\Users\lukev\Desktop\Discord Music Bot\...'
[90m    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:965:15)[39m
[90m    at Function.Module._load (internal/modules/cjs/loader.js:841:27)[39m
[90m    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:71:12)[39m
[90m    at internal/main/run_main_module.js:17:47[39m {
  code: [32m'MODULE_NOT_FOUND'[39m,
  requireStack: []
}
Thrown at:
    at Module._resolveFilename (internal/modules/cjs/loader.js:965:15)
    at Module._load (internal/modules/cjs/loader.js:841:27)
    at executeUserEntryPoint (internal/modules/run_main.js:71:12)
    at internal/main/run_main_module.js:17:47
*/