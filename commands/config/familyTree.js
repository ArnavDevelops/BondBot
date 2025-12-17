const User = require('../../schemas/mainSchema');
const Family = require('../../schemas/familySchema');
const { SlashCommandBuilder } = require("discord.js")
const { buildRelationshipGraph, generateAsciiFamilyTree } = require('../../helpers/familyTree');

module.exports = {
  data: new SlashCommandBuilder()
        .setName("familytree")
        .setDescription("Family tree")
        .setDMPermission(false)
        .addStringOption((option) =>
        option
          .setName("user")
          .setDescription("The user")
          .setRequired(false)
        ),
  async execute(interaction) {
    const targetUserId = interaction.options.getString('user') || interaction.user.id;
    const guildId = interaction.guildId;

    // Build graph (this does DB lookups - keep in async)
    const { graph, rootId } = await buildRelationshipGraph(targetUserId, guildId, { UserModel: User, FamilyModel: Family, nameField: 'userId' });

    const ascii = generateAsciiFamilyTree(graph, rootId, { maxDepth: 20 });

    if (ascii.length <= 1900) {
      await interaction.reply(`\`\`\`\n${ascii}\n\`\`\``);
    } else {
      // too long: send as attachment (discord file)
      const buffer = Buffer.from(ascii, 'utf8');
      await interaction.reply({ files: [{ attachment: buffer, name: `${targetUserId}-family-tree.txt` }] });
    }
  }
};
