const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")
const mainSchema = require("../../schemas/mainSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("marry")
        .setDescription("Makes you start a journey with someone")
        .addUserOption((u) =>
            u
                .setName("user")
                .setDescription("Select your lover..")
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction, client) {
        const { options, guild } = interaction;
        const user = options.getUser("user")

        if (user.id == interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription("***:warning: you cannot marry yourself :skull:.***")
            await interaction.reply({ embeds: [embed], ephemeral: true })
        } else {

            const FamilyData = await familySchema.findOne({
                guildId: guild.id,
                $or: [
                    { ownerId: interaction.user.id },
                    { familyMembers: { $elemMatch: { id: interaction.user.id } } }
                ]
            })
            const mainData = await mainSchema.findOne({ guildId: guild.id, userId: interaction.user.id, familyId: FamilyData?._id });
            const UserFamilyData = await familySchema.findOne({
                guildId: guild.id,
                $or: [
                    { ownerId: user.id },
                    { familyMembers: { $elemMatch: { id: user.id } } }
                ]
            })
            const UserMainData = await mainSchema.findOne({ guildId: guild.id, userId: user.id, familyId: UserFamilyData?._id });
            if (!UserMainData || !mainData) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("***:warning: Error using the command. Make sure you and the user are in a family.***")
                return await interaction.reply({ embeds: [embed] })
            } else if (UserMainData && mainData) {
                if (mainData.loveId == user.id || UserMainData.loveId == interaction.user.id) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("***:warning: You or the user are already engaged or married with somebody.***")
                    return await interaction.reply({ embeds: [embed], ephemeral: true })
                }
                const yes = new ButtonBuilder()
                    .setCustomId("marryYes")
                    .setLabel("Sure")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
                const no = new ButtonBuilder()
                    .setCustomId("marryNo")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(false)
                const row = new ActionRowBuilder().addComponents(yes, no);

                const embed1 = new EmbedBuilder()
                    .setColor("Random")
                    .setDescription(`***<@${user.id}>, <@${interaction.user.id}> wants to marry you!! <:ouno_embarassed:1241488506157793361>***`)
                const msg = await interaction.reply({ content: `<@${user.id}>`, embeds: [embed1], components: [row] })

                try {
                    const confirmation = await msg.awaitMessageComponent({ filter: i => i.user.id == user.id, time: 60_000 })

                    if (confirmation.customId == "marryYes") {
                        await mainSchema.findOneAndUpdate({ userId: user.id }, { loveId: interaction.user.id, status: "Married" })
                        await mainSchema.findOneAndUpdate({ userId: interaction.user.id }, { loveId: user.id, status: "Married" })

                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription(`***<@${user.id}> has officially married <@${interaction.user.id}> <:ouno_love:1241489974659121192>***`)
                        await confirmation.update({ content: ``, embeds: [embed], components: [] })
                    } else if (confirmation.customId == "marryNo") {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`***<@${user.id}> has decided not to marry <@${interaction.user.id}>.***`)
                        await confirmation.update({ content: ``, embeds: [embed], components: [] })
                    }
                } catch (err) {
                    return;
                }
            }
        }
    }
}