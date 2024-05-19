const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const settingSchema = require("../../schemas/settingSchema.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Config")
        .setDMPermission(false)
        .addBooleanOption((b) =>
            b
                .setName("cousin")
                .setDescription("Should marriage & engagement between cousins be allowed?")
        )
        .addBooleanOption((b) =>
            b
                .setName("sibling")
                .setDescription("Should marriage & engagement between siblings be allowed?")
        ),
    async execute(interaction, client) {
        const { options, guild } = interaction;

        const cousin = options.getBoolean("cousin");
        const sibling = options.getBoolean("sibling");

        const data = await settingSchema.findOne({ guildId: guild.id })
        if (!data) {
            new settingSchema({
                guildId: guild.id,
                cousin: false,
                sibling: false,
            }).save()
        }

        if (data) {
            if (cousin == true) {
                if (data.cousin == true) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("***:warning: The toggle is already on true.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setDescription("***:white_check_mark: Successfully set the cousin marriage & engagement toggle as true.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return await settingSchema.findOneAndUpdate({ cousin: true });
                }
            } else if (cousin == false) {
                if (data.cousin == false) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("***:warning: The toggle is already on false.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setDescription("***:white_check_mark: Successfully set the cousin marriage & engagement toggle as false.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return await settingSchema.findOneAndUpdate({ cousin: false });
                }
            }

            if (sibling == true) {
                if (data.sibling == true) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("***:warning: The toggle is already on true.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setDescription("***:white_check_mark: Successfully set the sibling marriage & engagement toggle as true.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return await settingSchema.findOneAndUpdate({ sibling: true });
                }
            } else if (sibling == false) {
                if (data.sibling == false) {
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("***:warning: The toggle is already on false.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setDescription("***:white_check_mark: Successfully set sibling cousin marriage & engagement toggle as false.***")
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    return await settingSchema.findOneAndUpdate({ sibling: true });
                }
            }
        }
    }
}