//Imports
const { ActivityType } = require("discord.js");
const { logMessage } = require("../../helpers/logging.js");
require("dotenv").config()

//Ready event
module.exports = {
  name: "ready",
  once: true,
  /**
  * @param {Client} client
  */
  async execute(client) {


    const statusArray = [
      {
        type: ActivityType.Playing,
        content: "with your wife"
      },
      {
        type: ActivityType.Watching,
        content: "Marriage Ceremonies"
      },
      {
        type: ActivityType.Listening,
        content: "Spotify"
      },
      {
        type: ActivityType.Streaming,
        content: "Engagement videos"
      },
      {
        type: ActivityType.Custom,
        content: "Watering the tree 🥰"
      }
    ];

    //Status | Main function
    async function pickPresence() {
      const option = Math.floor(Math.random() * statusArray.length);
      client.user.setStatus("dnd");
      try {
        await client.user.setPresence({
          activities: [
            {
              name: statusArray[option].content,
              type: statusArray[option].type,
            },
          ],
        });
      } catch (error) {
        return;
      }
    }
    setInterval(pickPresence, 8 * 1000);
    //Bot startup
    logMessage(`${client.user.username} is online!`, "INFO");
  },
};
