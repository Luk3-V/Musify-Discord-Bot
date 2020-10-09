module.exports = {
    name: 'shuffle',
    symbol: '🔀',
    category: 'basic',
    description: "Shuffle the queue into a random order.",
    usage: ['shuffle'],
    execute(message) {
        const server = message.client.servers.get(message.guild.id);
        const queue = server.queue;

        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);
        if(queue.auto) 
            return message.channel.send(`Can't shuffle autoplay (${message.author})`).catch(console.error);

        let songs = queue.songs;
        for (let i = songs.length - 1; i > 1; i--) {
            let j = 1 + Math.floor(Math.random() * i);
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        queue.songs = songs;
        server.queue = queue;
        queue.textChannel.send(`🔀 **Shuffled**`).catch(console.error);
    }
};