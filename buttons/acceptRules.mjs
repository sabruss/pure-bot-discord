export default {
    id: 'rules-accepted',
    execute: async ({interaction, client}) => {

        const {member, guild} = interaction;
        if (guild.available) {
            if (!guild.me.permissions.has('MANAGE_ROLES')) {
                await interaction.reply({
                    content: `Je ne possède pas les permissions merci de signaler ce soucis à un administrateur`,
                    ephemeral: true
                })
                return;
            }
            const role = guild.roles.cache.find(role => client.config.memberRole.includes(role.id));
            if (!role) {
                return;
            }
            if (!role.members.has(member.id)) {
                await member.roles.add(role)
                await interaction.reply({
                    content: `Vous venez d'accepter les règles. Le role ${role} vous à été ajouté`,
                    ephemeral: true
                })
            } else {
                await interaction.reply({content: 'Vous avez déjà accepter les règles.', ephemeral: true})
            }
        }

    }
}