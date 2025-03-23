const mongoose = require("mongoose");
const { broadcastClients } = require("../exports/wsUtils.js")
const baseService = require("../services/base.services.js")

const changeStreams = new Map();

// Start watching a specific model's collection
const startWatching = (modelName, pipeline = []) => {
    const collection = mongoose.connection.collection(modelName);
    const changeStream = collection.watch(pipeline);
    changeStreams.set(modelName, changeStream);

    changeStream.on("change", async (change) => {
        if(modelName === "donor_infos") {
            const doc = await baseService.getDonorById(change.documentKey._id);
            // Process change
            switch (change.operationType) {
                case "insert":
                    // broadcastClients(modelName, change.documentKey._id, { t: 1, p: "ADD_DONOR", c: doc });
                    break;
                case "update":
                    // broadcastClients(modelName, change.documentKey._id, { t: 1, p: "UPDATE_DONOR", c: doc });
                    break;
                case "delete":
                    // broadcastClients(modelName, change.documentKey._id, { t: 1, p: "REMOVE_DONOR", c: change.documentKey._id });
                    break;
                default:
                    break;
            }
        }
    });

    return changeStream;
}

// Close all active change streams
const closeAllChangeStreams = async () => {
    for (const [modelName, changeStream] of changeStreams.entries()) {
        console.log(`Closing change stream for ${modelName}`);
        await changeStream.close();
    }

    changeStreams.clear();
}

module.exports = { 
    startWatching, closeAllChangeStreams
}