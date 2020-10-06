module.exports = {
    name: 'prefix',
    aliases: [],
    symbol: '💬',
    category: 'basic',
    description: "Change command prefix.",
    execute(message, args) {
        const server = message.client.servers.get(message.guild.id);

        if(!args.length)
            return message.channel.send(`**Usage:** \`${server.prefix}prefix <PREFIX>\` (${message.author})`).catch(console.error);

        server.prefix = args[0];

        return message.channel.send(`💬  **Prefix set to:** \`${server.prefix}%\``).catch(console.error);
    }
};