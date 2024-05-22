const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")
const mainSchema = require("../../schemas/mainSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("adopt")
        .setDescription("Adopt a child")
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

        const familyData = await familySchema.findOne({
            guildId: guild.id,
            $or: [
                { ownerId: user.id },
                { familyMembers: { $elemMatch: { id: user.id } } }
            ]
        })
        const AdopterfamilyData = await familySchema.findOne({
            guildId: interaction.guild.id,
            $or: [
                { ownerId: interaction.user.id },
                { familyMembers: { $elemMatch: { id: interaction.user.id } } }
            ]
        })
        const mainData = await mainSchema.findOne({ guildId: guild.id, userId: user.id, familyId: familyData?._id })

        if (user.id == interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription("***:warning you cannot adopt yourself!***")
            await interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
            if (!familyData && AdopterfamilyData) {
                const yes = new ButtonBuilder()
                    .setCustomId("adoptYes")
                    .setLabel("Sure")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
                const no = new ButtonBuilder()
                    .setCustomId("adoptNo")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(false)
                const row = new ActionRowBuilder().addComponents(yes, no);

                const embed1 = new EmbedBuilder()
                    .setColor("Random")
                    .setDescription(`***<@${user.id}>, <@${interaction.user.id}> wants to adopt you!! <:ouno_love:1241489974659121192>***`)
                const msg = await interaction.reply({ content: `<@${user.id}>`, embeds: [embed1], components: [row] })

                try {
                    const confirmation = await msg.awaitMessageComponent({ filter: i => i.user.id == user.id, time: 60_000 })

                    if (confirmation.customId == "adoptYes") {
                        AdopterfamilyData.familyMembers.push({ id: user.id })
                        await AdopterfamilyData.save()

                        if (mainData) {
                            await mainSchema.findOneAndUpdate({ userId: user.id }, { parentId: interaction.user.id, familyId: AdopterfamilyData._id, status: "Adopted" })

                            const embed = new EmbedBuilder()
                                .setColor("Green")
                                .setDescription(`***:tada: <@${interaction.user.id}> has adopted <@${user.id}>***`)
                            await confirmation.update({ content: ``, embeds: [embed], components: [] })
                        } else {
                            new mainSchema({
                                userId: user.id,
                                familyId: AdopterfamilyData._id,
                                status: "Adopted",
                                parentId: interaction.user.id,
                                loveId: "None",
                            }).save().then(async (s) => {
                                const parent = guild.members.cache.get(s.parentId)

                                const embed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setDescription(`***:tada: <@${parent.id}> has adopted <@${user.id}>***`)
                                await confirmation.update({ content: ``, embeds: [embed], components: [] })
                            })
                        }
                    } else if (confirmation.customId == "adoptNo") {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(`***<@${user.id}> has decided not to get adopted by <@${interaction.user.id}.***`)
                        await confirmation.update({ content: ``, embeds: [embed], components: [] })
                    }
                } catch (err) {
                    return;
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`***:warning: Cannot execute this command as either the Adopter doesn't have a family or ${user.user.username} is already in a Family.***`)
                interaction.reply({ embeds: [embed], ephemeral: true })
            }
        }
    }
}