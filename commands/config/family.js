const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
        .setDescription("Tells you about your family.")
    )
    .addSubcommand((c) =>
    c
        .setName("settings")
        .setDescription("Configure your family.")
    ),
  async execute(interaction, client) {
    const { options, guild } = interaction;

    if(options.getSubcommand() == "create") {
        const name = options.getString("name")

    const data = await familySchema.findOne({
        $or: [
            { ownerId: interaction.user.id },
            { familyMembers: { $elemMatch: { id: interaction.user.id } } }
        ]
    })
    const userData = await mainSchema.findOne({ userId: interaction.user.id, familyId: data?._id });

        if(data || userData ) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("***:warning: You cannot create a family as you're already in a family.***")
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`***:white_check_mark: Successfully made a family named ${name}.***`)
            await interaction.reply({ embeds: [embed], ephemeral: true});

            new familySchema({
                ownerId: interaction.user.id,
                name: name,
                familyManagers: [],
                incest: false,
                status: "Normal",
                engagement: true,
                disown: true,
                familyMembers:[],
            }).save().then(s => {
                new mainSchema({
                    userId: interaction.user.id,
                    familyId: s._id,
                    status: "None",
                    parentId: "None",
                    loveId: "None",
                }).save()
            })
        }
    } else if(options.getSubcommand() == "info") {
        
    }
  }
}