import * as dotenv from 'dotenv';
import {Client, Collection, Intents} from "discord.js";
import {logger} from "./modules/logger.mjs";
import {default as config} from './config.mjs';
import fs from "fs";

dotenv.config();
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
client.config = config;
client.commands = new Collection();
client.buttons = new Collection();

client.on('ready', async () => {
    await client.loadCommand();
    logger.info(`Loaded ${client.commands.size} command(s)`);
    await client.loadButtons();
    logger.info(`Loaded ${client.buttons.size} interactive(s) buttons`);
    logger.info(`Logged in as ${client.user.tag}!`);

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
                        await createdCommand.setPermissions([{
                            id: process.env.BOT_OWNER,
                            type: "USER",
                            permission: true
                        }])
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
client.loadButtons = async () => {
    return new Promise(async (resolve, reject) => {
        const buttonsFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js') || file.endsWith('.mjs'));

        for (const file of buttonsFiles) {
            const command = (await import(`./buttons/${file}`)).default;
            client.buttons.set(command.id, command);
        }
        resolve();
    })
}


client.on('interaction', async interaction => {
    if (interaction.isCommand()) {
        const {options, commandName} = interaction

        const command = client.commands.find(command => command.name === commandName)
        const args = {}

        options.map(({name, value}) => {
            args[name] = value
        })
        if (command) {
            await command.execute({interaction, args, client})
            return;
        }
    }

    if (interaction.isButton()) {
        const {customID} = interaction
        const button = client.buttons.find(button => button.id === customID)

        if (button) {
            await button.execute({interaction, client})
            return;
        }
    }
})


client.on('guildCreate', async guild => {
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
                await createdCommand.setPermissions([{
                    id: process.env.BOT_OWNER,
                    type: "USER",
                    permission: true
                }])
            }
        })

        const commandsNoLongerExists = commands.filter(command => !client.commands.find(cmd => cmd.name === command.name));

        commandsNoLongerExists.map(async (command) => {
            await command.delete()
        })
    }
})

client.on('message', async message => {
    if (message.channel.type !== 'text') {
        return;
    }

    if (!config.guilds.includes(message.guild.id)) {
        return;
    }

    if (!config.channels.includes(message.channel.id)) {
        return;
    }

    if (message.deletable) {
        if (!message.author.bot) {
            logger.info(`Message to delete: [${message.id}] from ${message.author.tag} : \`${message.content}\``)
        }
        try {
            setTimeout(async () => {
                await message.delete()
                logger.info(`Message deleted: [${message.id}] from ${message.author.tag}`)
            },10000)
        } catch (e) {
            logger.error(e)
        }

    }
})

client.on('error', e => {
    logger.error(e)
});

process.on("unhandledRejection", err => {
    logger.error(err.stack)
});


client.login(process.env.BOT_TOKEN).catch(logger.error);