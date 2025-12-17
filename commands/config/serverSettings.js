const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const settingSchema = require("../../schemas/settingSchema.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Config")
        .setDMPermission(false)
        .addSubcommand((s) =>
            s
                .setName("cousin")
                .setDescription("should incest between cousins be allowed?")
                .addBooleanOption((b) =>
                    b
                        .setName("boolean")
                        .setDescription("Should marriage & engagement between cousins be allowed?")
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName("sibling")
                .setDescription("Should incest between siblings be allowed?")
                .addBooleanOption((b) =>
                    b
                        .setName("boolean")
                        .setDescription("Should marriage & engagement between siblings be allowed?")
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        const { options, guild } = interaction;

        const data = await settingSchema.findOne({ guildId: guild.id })
        if (!data) {
            new settingSchema({
                guildId: guild.id,
                cousin: false,
                sibling: false,
            }).save()
        }

        if (data) {
            if (options.getSubcommand() == "cousin") {
                const cousinBoolean = options.getBoolean("boolean");
                if (cousinBoolean == true) {
                    if (data.cousin == true) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on true.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the cousin marriage & engagement toggle as true.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                        return await settingSchema.findOneAndUpdate({ cousin: true });
                    }
                } else if (cousinBoolean == false) {
                    if (data.cousin == false) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on false.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the cousin marriage & engagement toggle as false.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                        return await settingSchema.findOneAndUpdate({ cousin: false });
                    }
                }
            } else if (options.getSubcommand() == "sibling") {
                const siblingBoolean = options.getBoolean("boolean");
                if (siblingBoolean == true) {
                    if (data.sibling == true) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on true.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the sibling marriage & engagement toggle as true.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                        return await settingSchema.findOneAndUpdate({ sibling: true });
                    }
                } else if (siblingBoolean == false) {
                    if (data.sibling == false) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on false.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set sibling cousin marriage & engagement toggle as false.***")
                        await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
                        return await settingSchema.findOneAndUpdate({ sibling: true });
                    }
                }
            }
        }
    }
}