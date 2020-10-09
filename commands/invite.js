
module.exports = {
    name: 'invite',
    symbol: '📩',
    category: 'basic',
    description: "Link to invite bot to server.",
    usage: ['invite'],
    execute(message) {
        return message.channel.send(`📩  **Invite Me!**\nhttps://discord.com/oauth2/authorize?client_id=749094673804689429&scope=bot&permissions=8`).catch(console.error);
    }
};