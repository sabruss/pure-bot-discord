import {Client, CommandInteraction} from 'discord.js'
import {inspect} from 'util'

export default {
    name: 'pure',
    description: 'Admin only',
    options: [
        {
            name: 'code',
            description: 'Code to eval',
            required: true,
            type: 3,
        }
    ],
    ownerOnly: true,
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    execute: async ({interaction, client}) => {

        if (interaction.user.id !== process.env.BOT_OWNER) {
            return;
        }
        try {
            const code = interaction.options.getString('code', true)

            let evaled = eval(code);
            if (typeof evaled !== "string")
                evaled = inspect(evaled);
            try {
                await interaction.reply({content: `${clean(evaled)}`, code: 'xl', ephemeral: true})
            } catch (err) {
                await interaction.reply({content: `ERROR: \n${clean(err)}`, code: 'xl', ephemeral: true})
            }
        } catch (e) {
            await interaction.reply({content: "Failed", ephemeral: true})
        }

    }
}

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}