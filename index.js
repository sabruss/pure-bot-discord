const Discord = require('discord.js');
const client = new Discord.Client();
require("dotenv").config();
const config = require('./config');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', async message => {

    if (!(message.channel.type === 'text')) {
        return;
    }

    if (!config.guilds.includes(message.guild.id)) {
        return;
    }

    if (checkFirstApril() && (!config.blackListCategoryChannels.includes(message.channel.parentID))) {
        await message.react(randomPoisson());
    }


    if (!config.channels.includes(message.channel.id)) {
        return;
    }

    if (message.deletable) {
        console.log(`Message to delete: [${message.id}] from ${message.author.tag} : \`${message.content}\``)
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

client.login(process.env.BOT_TOKEN || '').catch(e => console.error(e))


function randomPoisson() {
    const items = ['🐟', '🐡', '🐠']
    return items[Math.floor(Math.random() * items.length)];
}

function checkFirstApril() {
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    return day === 1 && month === 4;
}
