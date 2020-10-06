
// Load Config

const fs = require('fs');

let config = { 
    TOKEN: process.env.token,
	YOUTUBE_API_KEY: process.env.ytAPIKey,
	SPOTIFY_ID: process.env.spotifyID,
	SPOTIFY_SECRET: process.env.spotifySecret,
	MAX_PLAYLIST_SIZE: '5',
	PREFIX: '$',
	VERSION: '0.3'
};
let data = JSON.stringify(config, null, 2);
fs.writeFileSync('config.json', data);

// Main

const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { TOKEN, PREFIX, VERSION } = require('./config.json');
const { waitTimer } = require("./util/wait_timer.js");

const client = new Client();
client.options.http.api = 'https://discord.com/api';
client.commands = new Collection();
client.servers = new Map();

const commandFiles = readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}


client.on('ready', () => {
	console.log("Musify online! v" + VERSION);
	client.user.setActivity(`${client.prefix}help`);
});
client.on("error", console.error);

client.on("guildCreate", function(guild){
	console.log(`[${guild.id} JOIN]`);
    client.servers.set(guild.id, {
    	guild,
    	queue: null,
    	timer: null,
    	prefix: PREFIX,
		volume: 100,
		autoplay: true
    });
});
client.on("guildDelete", function(guild){
    console.log(`[${guild.id} GUILD REMOVED]`);
    client.servers.delete(guild.id);
});

client.on('message', message => {
	if(!client.servers.get(message.guild.id)) {
		console.log(`[${message.guild.id} JOIN]`);
	    client.servers.set(message.guild.id, {
	    	guild: message.guild,
	    	queue: null,
	    	timer: null,
	    	prefix: PREFIX,
			volume: 100,
			autoplay: true
	    });
	}
	const server = client.servers.get(message.guild.id);

	const messageStr = message.content.trim();
	if(!messageStr.startsWith(server.prefix) || message.author.bot) return;

	const args = messageStr.substring(server.prefix.length).split(/ +/);
	const command = client.commands.get(args.shift().toLowerCase().trim()); 

	if(!command) return;

	try {
		command.execute(message, args);
	} catch(error) {
		console.error(`[${message.guild.id}] ${error}`);
		message.channel.send(`**Error executing command.** ${message.author}`).catch(console.error);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	const server = client.servers.get(newState.guild.id);
	const oldChannel = oldState.channel;
	const newChannel = newState.channel;
	
	if(!oldChannel && newChannel) { // User Joins a voice channel
		if(server.queue && !server.queue.playing && newChannel === newChannel.guild.me.voice.channel && newChannel.members.size > 1) {
			clearTimeout(server.timer);
			server.queue.playing = true;
        	server.queue.connection.dispatcher.resume();
		}
	} else if(oldChannel && !newChannel) { // User leaves a voice channel
		if(server.queue && server.queue.playing && oldChannel === oldChannel.guild.me.voice.channel && oldChannel.members.size == 1) {
			waitTimer(server, 30);
			server.queue.playing = false;
        	server.queue.connection.dispatcher.pause(true);
		}
	}
});

client.login(TOKEN);