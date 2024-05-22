const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")
const mainSchema = require("../../schemas/mainSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("family")
        .setDescription("Configure the Family or see the information")
        .setDMPermission(false)
        .addSubcommand((c) =>
            c
                .setName("create")
                .setDescription("Creates your family.")
                .addStringOption((s) =>
                    s
                        .setName("name")
                        .setDescription("Name of the family?")
                        .setRequired(true)
                )
        )
        .addSubcommand((c) =>
            c
                .setName("info")
                .setDescription("Tells you about a family.")
        )
        .addSubcommand((c) =>
            c
                .setName("delete")
                .setDescription("Deletes your family.")
        ),
    async execute(interaction, client) {
        const { options, guild } = interaction;

        if (options.getSubcommand() == "create") {
            const name = options.getString("name")

            const data = await familySchema.findOne({
                guildId: guild.id,
                $or: [
                    { ownerId: interaction.user.id },
                    { familyMembers: { $elemMatch: { id: interaction.user.id } } }
                ]
            })
            const userData = await mainSchema.findOne({ guildId: guild.id, userId: interaction.user.id });

            if (data && userData.familyId !== null) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("***:warning: You cannot create a family as you're already in a family.***")
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`***:white_check_mark: Successfully made a family named ${name}.***`)
                await interaction.reply({ embeds: [embed], ephemeral: true });

                new familySchema({
                    guildId: guild.id,
                    ownerId: interaction.user.id,
                    name: name,
                    familyManagers: [],
                    incest: false,
                    engagement: true,
                    disown: true,
                    familyMembers: [],
                }).save().then(s => {
                    new mainSchema({
                        guildId: guild.id,
                        userId: interaction.user.id,
                        familyId: s._id,
                        status: "None",
                        parentId: "None",
                        loveId: "None",
                    }).save()
                })
            }
        } else if (options.getSubcommand() == "info") {
            const data = await familySchema.findOne({
                guildId: guild.id,
                $or: [
                    { ownerId: interaction.user.id },
                    { familyMembers: { $elemMatch: { id: interaction.user.id } } }
                ]
            })
            if (!data) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("***:warning: You're not in a family to execute this command!***")
                await interaction.reply({ embeds: [embed], ephemeral: true })
            } else {
                try {
                    let familyManagersContent = ""
                    const familyManagers = data.familyManagers.map(d => d.familyManagers)
                    if (familyManagers.length >= 1) {
                        familyManagersContent += familyManagers
                    } else if (familyManagers.length <= 1) {
                        familyManagersContent += "No family managers.";
                    }

                    let engagementValue = "";
                    if (data.engagement == true) {
                        engagementValue += "This family allows engagement before marriage"
                    } else if (data.engagement == false) {
                        engagementValue += "This family does not allow engagement before marriage"
                    }

                    const button = new ButtonBuilder()
                        .setCustomId("familyInfoMembers")
                        .setLabel("Members in this family")
                        .setStyle(ButtonStyle.Primary)
                    const row = new ActionRowBuilder().addComponents(button)

                    const embed = new EmbedBuilder()
                        .setColor("Random")
                        .setTitle(`About the "${data.name}" family`)
                        .addFields([
                            { name: "Owner", value: `<@${data.ownerId}> (${data.ownerId})` },
                            { name: "Family managers", value: familyManagersContent },
                            { name: "Disown", value: `This family has set disown to ${data.disown}` },
                            { name: "Incest", value: `This family has set incest to ${data.incest}` },
                            { name: "Engagement", value: engagementValue }
                        ])
                    const msg = await interaction.reply({ embeds: [embed], components: [row] })
                    try {
                        const collector = await msg.createMessageComponentCollector({ componentType: ComponentType.Button })


                        collector.on("collect", async (interaction) => {
                            if (interaction.customId == "familyInfoMembers") {
                                if (data) {
                                    membersContent = ""
                                    const members = data.familyMembers.map(member => `<@${member.id}>`).join('\n ')
                                    if (members.length >= 1) {
                                        membersContent += members
                                    } else if (members.length == 0) {
                                        membersContent += "No members.";
                                    }
                                    const membersSize = data.familyMembers.length

                                    const embed = new EmbedBuilder()
                                        .setColor("Random")
                                        .setTitle(`Members in the family! [${membersSize}]`)
                                        .setDescription(members || "No members.")
                                    return await interaction.reply({ embeds: [embed], ephemeral: true })
                                }
                            }
                        })
                    } catch (err) {
                        return;
                    }
                } catch (err) {
                    return;
                }
            }
        } else if (options.getSubcommand() === "delete") {
            const data = await familySchema.findOne({
                guildId: guild.id,
                $or: [
                    { ownerId: interaction.user.id },
                    { familyManagers: { $elemMatch: { id: interaction.user.id } } }
                ]
            })
            const mainData = await mainSchema.findOne({ guildId: guild.id, familyId: data._id })

            if (!data || !mainData) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription("***Either you're not in a family, or you're not a manager in the family!***")
                await interaction.reply({ embeds: [embed], ephemeral: true })
            }

            const button = new ButtonBuilder()
                .setCustomId("deleteYes")
                .setLabel("Yes, I'm sure.")
                .setStyle(ButtonStyle.Primary)
            const button2 = new ButtonBuilder()
                .setCustomId("deleteNo")
                .setLabel("No, I change my mind.")
                .setStyle(ButtonStyle.Danger)
            const row = new ActionRowBuilder().addComponents(button, button2)

            const embed = new EmbedBuilder()
                .setColor("Random")
                .setDescription(`***Are you sure you want to delete your family!? This also deletes everything, including your descendants.***`)
            const msg = await interaction.reply({ embeds: [embed], components: [row] });

            try {
                const confirmation = await msg.awaitMessageComponent({ filter: i => i.user.id == interaction.user.id, time: 60_000 })
                mainData.forEach(async (m) => {
                    await mainSchema.findOneAndUpdate({ familyId: m.familyId }, { familyId: null })
                })
                if (confirmation.customId == "deleteYes") {
                    if (data) {
                        await familySchema.findOneAndDelete({
                            $or: [
                                { ownerId: interaction.user.id },
                                { familyManagers: { $elemMatch: { id: interaction.user.id } } }
                            ]
                        });

                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:white_check_mark: Successfully deleted the family***")
                        await confirmation.update({ embeds: [embed], components: [] })
                    }
                } else if (confirmation.customId == "deleteNo") {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(`***<@${interaction.user.id} has decided not to delete the family.***`)
                    await confirmation.update({ embeds: [embed], components: [] })
                }
            } catch (err) {
                return;
            }
        }
    }
}