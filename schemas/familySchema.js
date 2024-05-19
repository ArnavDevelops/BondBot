const { Schema, model, SchemaTypes } = require("mongoose");

const familySchema = new Schema({
    ownerId: String,
    name: String,
    familyManagers: [],
    incest: Boolean,
    status: String,
    engagement: Boolean,
    disown: Boolean,
    familyMembers:{ type: [{id: String}], default: [] },
})

module.exports = model("family", familySchema)
