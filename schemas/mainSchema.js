const { Schema, model, SchemaTypes } = require("mongoose");

const mainSchema = new Schema({
    userId: String,
    familyId: { type: SchemaTypes.ObjectId, ref: "family", required: false },
    status: String,
    parentId: String,
    loveId: String,
})

module.exports = model("user", mainSchema)
