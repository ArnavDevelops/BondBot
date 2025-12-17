const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")
const mainSchema = require("../../schemas/mainSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("disown")
        .setDescription("Disowns a child")
        .addUserOption((u) =>
            u
                .setName("user")
                .setDescription("Select the user")
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction, client) {
        const { options, guild } = interaction;
        const user = guild.members.cache.get(options.getUser("user").id)

        const parentFamilyData = await familySchema.findOne({
            guildId: interaction.guild.id,
            $or: [
                { ownerId: interaction.user.id },
                { familyMembers: { $elemMatch: { id: interaction.user.id } } }
            ]
        })
        const parentMainData = await mainSchema.findOne({ guildId: guild.id, userId: user.id, familyId: parentFamilyData?._id })
        const childFamilyData = await familySchema.findOne({
            guildId: guild.id,
            $or: [
                { ownerId: user.id },
                { familyMembers: { $elemMatch: { id: user.id } } }
            ]
        })
        const childMainData = await mainSchema.findOne({ guildId: guild.id, userId: user.id, familyId: parentFamilyData?._id })
        if (!parentFamilyData && !parentMainData && !childFamilyData && !childMainData) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("***:warning: Either you or the child doesn't have a family. Couldn't execute the command!***")
            return await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] })
        } else {
            if (parentFamilyData.disown == false) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription("***:warning: you cannot disown a child as your family does not allow disown.***")
                await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] })
            } else {
                if (user.id == interaction.user.id) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription("***:warning you cannot disown yourself!***")
                    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] })
                } else {
                    const yes = new ButtonBuilder()
                        .setCustomId("disownYes")
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(false)
                    const no = new ButtonBuilder()
                        .setCustomId("disownNo")
                        .setLabel("No")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(false)
                    const row = new ActionRowBuilder().addComponents(yes, no);

                    const embed1 = new EmbedBuilder()
                        .setColor("Random")
                        .setDescription(`***Are you sure you wanna disown your child ${user.user.username}?***`)
                    const msg = await interaction.reply({ embeds: [embed1], components: [row] })

                    try {
                        const confirmation = await msg.awaitMessageComponent({ filter: i => i.user.id == interaction.user.id, time: 60_000 })

                        if (confirmation.customId === "disownYes") {
                            parentFamilyData.familyMembers.pull({ id: user.id })
                            await parentFamilyData.save()

                            await mainSchema.findOneAndUpdate({ userId: user.id }, { parentId: "None", familyId: null, status: "None" })

                            const embed = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`***😔 ${user.user.username} has been disowned by their parent ${interaction.user.username}.***`)
                            await confirmation.update({ embeds: [embed], components: [] })
                        } else if (confirmation.confirmId === "disownNo") {
                            const embed = new EmbedBuilder()
                                .setColor("Green")
                                .setDescription(`***${interaction.user.username} has decided not to disown their child ${user.user.username}.***`)
                            await confirmation.update({ embeds: [embed], components: [] })
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
            }
        }
    }
}