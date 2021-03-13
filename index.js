const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
    if (!(message.guild.id === '819276769693401099' && message.channel.id === '819276770343387150')) {
        return;
    }

    if (message.deletable) {
        console.log(`Message to delete: [${message.id}] from ${message.author.tag}`)
        try {
            await message.delete({
                timeout: 10000,
                reason: 'Clean musique channel'
            })
            console.log(`Message deleted: [${message.id}] from ${message.author.tag}`)
        } catch (e) {
            console.error(e)
        }

    }

});


client.login(process.env.BOT_TOKEN);