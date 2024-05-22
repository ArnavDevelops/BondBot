const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const familySchema = require("../../schemas/familySchema.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("familysetting")
        .setDescription("Configuring family")
        .setDMPermission(false)
        .addSubcommand((s) =>
            s
                .setName("incest")
                .setDescription("should incest between siblings and cousins be allowed? Also depends on server settings.")
                .addBooleanOption((b) =>
                    b
                        .setName("boolean")
                        .setDescription("Should it be true or false?")
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName("engagement")
                .setDescription("should engagement be allowed in the family before marriage?")
                .addBooleanOption((b) =>
                    b
                        .setName("boolean")
                        .setDescription("Should it be true or false?")
                        .setRequired(true)
                )
        )
        .addSubcommand((s) =>
            s
                .setName("disown")
                .setDescription("Can a parent in the family be allowed to disown their child?")
                .addBooleanOption((b) =>
                    b
                        .setName("boolean")
                        .setDescription("Should it be true or false?")
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        const { options, guild } = interaction;
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
                .setDescription("***Either you're not in a family, or you're not a manager in the family!***")
            await interaction.reply({ embeds: [embed], ephemeral: true })
        }

        if (data) {
            if (options.getSubcommand() == "incest") {
                const incestBoolean = options.getBoolean("boolean");
                if (incestBoolean == true) {
                    if (data.incest == true) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled the incest on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ incest: true });
                    }
                } else if (incestBoolean == false) {
                    if (data.incest == false) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled the incest on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ incest: false });
                    }
                }
            } else if (options.getSubcommand() == "engagement") {
                const engagementBoolean = options.getBoolean("boolean");
                if (engagementBoolean == true) {
                    if (data.engagement == true) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled engagement on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ engagement: true });
                    }
                } else if (engagementBoolean == false) {
                    if (data.engagement == false) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled engagement on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ engagement: false });
                    }
                }
            } else if (options.getSubcommand() == "disown") {
                const disownBoolean = options.getBoolean("boolean");
                if (disownBoolean == true) {
                    if (data.disown == true) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled disown on true.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ disown: true });
                    }
                } else if (disownBoolean == false) {
                    if (data.disown == false) {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The toggle is already on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully toggled disown on false.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return await familySchema.findOneAndUpdate({ disown: false });
                    }
                }
            } else if (options.getSubcommand() == "status") {
                const status = options.getString("status")
                if (status == "liberal") {
                    if (data.status == "Liberal") {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The status is already Liberal.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the status of the family on Liberal.***")
                        await interaction.reply({ embeds: [embed] });
                        return await familySchema.findOneAndUpdate({ status: "Liberal" });
                    }
                } else if (status == "normal") {
                    if (data.status == "Normal") {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The status is already Normal.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the status of the family on Normal.***")
                        await interaction.reply({ embeds: [embed] });
                        return await familySchema.findOneAndUpdate({ status: "Normal" });
                    }
                } else if (status == "conservative") {
                    if (data.status == "Conservative") {
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("***:warning: The status is already Conservative.***")
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setDescription("***:white_check_mark: Successfully set the status of the family on Conservative.***")
                        await interaction.reply({ embeds: [embed] });
                        return await familySchema.findOneAndUpdate({ status: "Conservative" });
                    }
                }
            }
        }
    }
}