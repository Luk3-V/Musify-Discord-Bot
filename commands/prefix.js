module.exports = {
    name: 'prefix',
    aliases: [],
    symbol: '💬',
    category: 'basic',
    description: "Change command prefix.",
    execute(message, args) {
        if(!args.length)
            return message.channel.send(`**Usage:** \`${message.client.prefix}prefix <PREFIX>\` (${message.author})`).catch(console.error);

        message.client.prefix = args[0];

        return message.channel.send(`💬  **Prefix set to:** \`${message.client.prefix}%\``).catch(console.error);
    }
};