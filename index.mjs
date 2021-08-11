import * as dotenv from 'dotenv';
import {Client, Collection, Intents, MessageEmbed, GuildMember, Formatters} from "discord.js";
import {default as config} from './config.mjs';
import fs from "fs";

dotenv.config();
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]});
client.config = config;
client.commands = new Collection();
client.buttons = new Collection();

client.on('ready', async () => {
    await client.loadCommand();
    console.log(`Loaded ${client.commands.size} command(s)`);
    console.log(`Logged in as ${client.user.tag}!`);

});


client.loadCommand = async (force = false) => {
    return new Promise(async (resolve, reject) => {
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') || file.endsWith('.mjs'));

        for (const file of commandFiles) {
            const command = (await import(`./commands/${file}`)).default;
            client.commands.set(command.name, command);
        }


        client.guilds.cache.map(async guild => {
            if (guild.available) {
                const commands = await guild.commands.fetch();
                const commandsNotAvailableYet = client.commands.filter(command => !commands.find(cmd => cmd.name === command.name) || force);

                commandsNotAvailableYet.map(async (command) => {
                    const createdCommand = await guild.commands.create({
                        name: command.name,
                        description: command.description,
                        options: command.options || [],
                        defaultPermission: !command.ownerOnly
                    })
                    if (command.ownerOnly) {
                        await createdCommand.permissions.set({
                            permissions: [{
                                id: process.env.BOT_OWNER,
                                type: "USER",
                                permission: true
                            }]
                        })
                    }
                })

                const commandsNoLongerExists = commands.filter(command => !client.commands.find(cmd => cmd.name === command.name));

                commandsNoLongerExists.map(async (command) => {
                    await command.delete()
                })
            }
        })

        resolve();
    })
}

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const {commandName} = interaction

        const command = client.commands.find(command => command.name === commandName)
        if (command) {
            await command.execute({interaction, client})
            return;
        }

        return await interaction.reply({content: 'command not found', ephemeral: true});

    }
})

client.on('messageCreate', async message => {

    if (message.channel.type !== 'GUILD_TEXT') {
        return;

    }
    const guildSettings = config.find(guildSetting => guildSetting.id === message.guildId);
    if (!guildSettings) {
        return;
    }

    if (!guildSettings.deleteInChannels.includes(message.channelId)) {
        return;
    }

    if (message.deletable) {
        if (!message.author.bot) {
            console.log(`Message to delete: [${message.id}] from ${message.author.tag} : \`${message.content}\``)
        }
        try {
            setTimeout(async () => {
                await message.delete()
                console.log(`Message deleted: [${message.id}] from ${message.author.tag}`)
            }, 10000)
        } catch (e) {
            console.error(e)
        }

    }
})


client.on('guildMemberAdd', async guildMember => {
    const guild = guildMember.guild;

    const guildSettings = config.find(guildSetting => guildSetting.id === guild.id);
    if (!guildSettings) {
        return;
    }

    const logChannel = guild.channels.cache.find(channel => channel.id === guildSettings.logChannel);

    if (!logChannel || !logChannel.isText) {
        return;
    }

    try {
        await logChannel.send({embeds: [joinEmbed(guildMember)]});
    } catch (e) {

    }
})

client.on('guildMemberRemove', async guildMember => {

    const guild = guildMember.guild;

    const guildSettings = config.find(guildSetting => guildSetting.id === guild.id);
    if (!guildSettings) {
        return;
    }

    const logChannel = guild.channels.cache.find(channel => channel.id === guildSettings.logChannel);

    if (!logChannel || !logChannel.isText) {
        return;
    }

    try {
        await logChannel.send({embeds: [leaveEmbed(guildMember)]});
    } catch (e) {

    }
})

client.on('error', e => {
    console.error(e)
});


/**
 *
 * @param {GuildMember} guildMember
 * @returns {MessageEmbed}
 */
const joinEmbed = (guildMember) => {
    const createdTimestamp = Math.floor(guildMember.user.createdTimestamp / 1000);
    const joinedTimestamps = Math.floor(guildMember.joinedTimestamp / 1000);
    return (
        new MessageEmbed()
            .setColor("GREEN")
            .setAuthor(guildMember.user.tag, guildMember.user.displayAvatarURL({dynamic: true}))
            .setDescription(`
                • User: ${guildMember.user} - \`${guildMember.user.tag}\` (${guildMember.id})
                • Compte crée: <t:${createdTimestamp}:${Formatters.TimestampStyles['LongDateTime']}> (<t:${createdTimestamp}:${Formatters.TimestampStyles['RelativeTime']}>)
                • Rejoint : <t:${joinedTimestamps}:${Formatters.TimestampStyles['LongDateTime']}> (<t:${joinedTimestamps}:${Formatters.TimestampStyles['RelativeTime']}>)
            `)
            .setFooter('Un utilisateur à rejoint le serveur')
            .setTimestamp()
    )
}


/**
 *
 * @param {GuildMember} guildMember
 * @returns {MessageEmbed}
 */
const leaveEmbed = (guildMember) => {

    const leaveDate = Math.floor(Date.now() / 1000);
    const createdTimestamp = Math.floor(guildMember.user.createdTimestamp / 1000);
    const joinedTimestamps = Math.floor(guildMember.joinedTimestamp / 1000);
    return (
        new MessageEmbed()
            .setColor("RED")
            .setAuthor(guildMember.user.tag, guildMember.user.displayAvatarURL({dynamic: true}))
            .setDescription(`
                • User: ${guildMember.user} - \`${guildMember.user.tag}\` (${guildMember.id})
                • Compte crée: <t:${createdTimestamp}:${Formatters.TimestampStyles['LongDateTime']}> (<t:${createdTimestamp}:${Formatters.TimestampStyles['RelativeTime']}>)
                • Rejoint: <t:${joinedTimestamps}:${Formatters.TimestampStyles['LongDateTime']}> (<t:${joinedTimestamps}:${Formatters.TimestampStyles['RelativeTime']}>)
                • Parti: <t:${leaveDate}:${Formatters.TimestampStyles['LongDateTime']}> (<t:${leaveDate}:${Formatters.TimestampStyles['RelativeTime']}>)
            `)
            .setFooter('Un utilisateur à quitter le serveur')
            .setTimestamp()
    )
}

process.on("unhandledRejection", err => {
    console.error(err.stack)
});
client.login(process.env.BOT_TOKEN).catch(console.error);