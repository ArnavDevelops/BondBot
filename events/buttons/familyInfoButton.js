//Imports
const { EmbedBuilder } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")

//Interaction Create event
module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    const { customId } = interaction;

    if(!interaction.isButton()) return;

    if(customId == "familyInfoMembers") {
        const data = await familySchema.findOne({
            $or: [
                { ownerId: interaction.user.id },
                { familyMembers: { $elemMatch: { id: interaction.user.id } } }
            ]
        })
        if(!data) return;

        if(data) {
            membersContent = ""
            const members = data.familyMembers.map(member => `<@${member.id}>`).join('\n ')
            if (members.length >= 1) {
                membersContent += members
            } else if (members.length <= 1) {
                membersContent += "No members.";
            }
            const membersSize = data.familyMembers.length

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle(`Members in the family! [${membersSize}]`)
                .setDescription(members)
            await interaction.reply({ embeds: [embed], ephemeral: true })
        }
    }
  }
}