const { Schema, model } = require("mongoose");

const settingSchema = new Schema({
    guildId: String,
    cousin: Boolean,
    sibling: Boolean,
})

module.exports = model("serverSetting", settingSchema)
