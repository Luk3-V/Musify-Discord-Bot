
// Load Config

const fs = require('fs');

let config = { 
    TOKEN: process.env.token,
	YOUTUBE_API_KEY: process.env.ytAPIKey,
	SPOTIFY_ID: process.env.spotifyID,
	SPOTIFY_SECRET: process.env.spotifySecret,
	MAX_PLAYLIST_SIZE: '5',
	PREFIX: '$',
	VERSION: '0.2'
};
let data = JSON.stringify(config, null, 2);
fs.writeFileSync('config.json', data);

// Main

const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { TOKEN, PREFIX, VERSION } = require('./config.json');

const client = new Client();
client.options.http.api = 'https://discord.com/api';
client.commands = new Collection();
client.prefix = PREFIX;
client.queues = new Map();
client.volume = 100;
client.autoplay = true;

const commandFiles = readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}


client.on('ready', () => {
	console.log("Musify online! v" + VERSION);
	client.user.setActivity(`${PREFIX}help`);
});

client.on("error", console.error);

client.on('message', message => {
	const messageStr = message.content.trim();
	if(!messageStr.startsWith(PREFIX) || message.author.bot) return;

	const args = messageStr.substring(PREFIX.length).split(/ +/);
	const command = client.commands.get(args.shift().toLowerCase()); 

	if(!command) return;

	try {
		command.execute(message, args);
	} catch(error) {
		console.error(`[${message.guild.id}] ${error}`);
		message.channel.send(`**Error executing command.** ${message.author}`).catch(console.error);
	}
});

client.login(TOKEN);