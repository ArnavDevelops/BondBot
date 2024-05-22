const { Schema, model } = require("mongoose");

const familySchema = new Schema({
    guildId: String,
    ownerId: String,
    name: String,
    familyManagers: { type: [{id: String}], default: [] },
    incest: Boolean,
    engagement: Boolean,
    disown: Boolean,
    familyMembers:{ type: [{id: String}], default: [] },
})

module.exports = model("family", familySchema)
