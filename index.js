const { loadConfig } = require("./util/load_config.js");
loadConfig(process.env);

const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { waitTimer } = require("./util/wait_timer.js");
const { newSettings, saveSettings, getSettings } = require("./util/settings.js");
const config = require('./config.json');

const client = new Client();
client.options.http.api = 'https://discord.com/api';
client.commands = new Collection();
client.servers = getSettings();

const commandFiles = readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}


client.on('ready', () => {
	client.user.setActivity(`${config.PREFIX}help`);
	console.log("Musify online! v" + config.VERSION);
});
client.on("disconnect", function(event){
	saveSettings(client.servers);
    console.log(`Musify Offline!`);
});
client.on("error", console.error);


client.on("guildCreate", function(guild){
	console.log(`[${guild.id}] JOINED`);
	newSettings(client.servers, guild);
});
client.on("guildDelete", function(guild){
    console.log(`[${guild.id}] GUILD REMOVED`);
    client.servers.delete(guild.id);
});


client.on('message', message => {
	let server = client.servers.get(message.guild.id);
	if(!server) {
		console.log(`[${message.guild.id}] JOINED`);
	    newSettings(client.servers, message.guild);
	    server = client.servers.get(message.guild.id);
	} else if(!server.guild) {
		server.guild = message.guild;
	}

	const messageStr = message.content.trim();
	if(messageStr.startsWith(config.PREFIX + 'help')) // HELP USING OLD PREFIX
		return message.channel.send(`**Prefix changed! Use:** \`${server.prefix}help\`(${message.author})`).catch(console.error);
	if(!messageStr.startsWith(server.prefix) || message.author.bot) return;

	const args = messageStr.substring(server.prefix.length).split(/ +/);
	const commandStr = args.shift().toLowerCase().trim();
	const command = client.commands.get(commandStr); 

	if(commandStr === 'save') { // TEMPORARY SAVE SERVER SETTINGS
		saveSettings(client.servers);
	}

	if(!command) return;

	try {
		command.execute(message, args);
	} catch(error) {
		console.error(`[${message.guild.id}] ${error}`);
		message.channel.send(`**Error executing command.** ${message.author}`).catch(console.error);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	let server = client.servers.get(newState.guild.id);
	if(!server) {
		console.log(`[${newState.guild.id}] JOINED`);
	    newSettings(client.servers, newState.guild);
	    server = client.servers.get(newState.guild.id);
	} else if(!server.guild) {
		server.guild = newState.guild;
	}

	const oldChannel = oldState.channel;
	const newChannel = newState.channel;
	
	if(!oldChannel && newChannel) { // User joins a voice channel
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


client.login(config.TOKEN);