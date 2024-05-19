const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")
const mainSchema = require("../../schemas/mainSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("runaway")
        .setDescription("Makes you quit the family, can be adopted or given birth to again.")
        .setDMPermission(false),
    async execute(interaction, client) {
        const { guild } = interaction;

        const data = await familySchema.findOne({
            $or: [
                { ownerId: interaction.user.id },
                { familyMembers: { $elemMatch: { id: interaction.user.id } } }
            ]
        })
        const mainData = await mainSchema.findOne({ userId: interaction.user.id, familyId: data?._id })
        if (!data || !mainData) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription("***:warning: Error using the command. No data.***")
            await interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
            if (data.ownerId == interaction.user.id) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription("***:warning: You're the creator or the owner of the family, you cannot run away!***")
                await interaction.reply({ embeds: [embed], ephemeral: true })
            } else {
                const yes = new ButtonBuilder()
                    .setCustomId("runawayYes")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
                const no = new ButtonBuilder()
                    .setCustomId("runawayNo")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(false)
                const row = new ActionRowBuilder().addComponents(yes, no);

                const embed1 = new EmbedBuilder()
                    .setColor("Random")
                    .setDescription("***Are you sure you wanna run away from your current family?***")
                const msg = await interaction.reply({ embeds: [embed1], components: [row] })

                try {
                    const confirmation = await msg.awaitMessageComponent({ filter: i => i.user.id == interaction.user.id, time: 60_000 })

                    if(confirmation.customId === "runawayYes") {
                        data.familyMembers.pull({ id: interaction.user.id })
                        await data.save()
        
                        await mainSchema.findOneAndUpdate({ userId: interaction.user.id, loveId: mainData.loveId }, { parentId: "None", familyId: null, status: "None" })
        
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`***😔 ${interaction.user.username} has ran away from their family.***`)
                        await confirmation.update({ embeds: [embed], components: [] })
                    } else if(confirmation.confirmId === "runawayNo") {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(`***${interaction.user.username} has decided not to run away from their family.***`)
                        await confirmation.update({ embeds: [embed], components: [] })
                    }
                } catch(e) {
                    console.log(e)
                }                
            }
        }
    }
}