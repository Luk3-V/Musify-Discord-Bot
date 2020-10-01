

module.exports = {
    name: 'shuffle',
    symbol: '🔀',
    category: 'basic',
    description: "Shuffle queue.",
    execute(message) {
        const queue = message.client.queues.get(message.guild.id);
        if(!queue) 
            return message.channel.send(`No songs in queue (${message.author})`).catch(console.error);

        let songs = queue.songs;
        for (let i = songs.length - 1; i > 1; i--) {
            let j = 1 + Math.floor(Math.random() * i);
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        queue.songs = songs;
        message.client.queues.set(message.guild.id, queue);
        queue.textChannel.send(`🔀 **Shuffled**`).catch(console.error);
    }
};