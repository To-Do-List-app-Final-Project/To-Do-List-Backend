const express = require("express")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const cors = require("cors")
const app = express()
const mongoose = require("mongoose")
const moment = require("moment")
const SysConst = require("./exports/const")
//* Version Configuration
const APP_NAME = "pacs-controller-services"
const VERSION_NUMBER = SysConst.VERSION
let uptime = null
const contextUtils = require('./exports/contextUtils')
const idUtils = require('./exports/idUtils')
const cron = require("./cronJob/cron.operation");
const log = require('./exports/logUtils').getLogger('fw.index');
const { startWatching, closeAllChangeStreams } = require('./exports/dbUtils')
const { disconnectedClients } = require('./exports/wsUtils')

//* configure dotenv
dotenv.config()

const aganda = require("./cronJob/agenda.service");

contextUtils.run(async () => {
    contextUtils.put('fwTrack', `${new Date().getTime()}${idUtils.countId()}${Math.floor(Math.random()*1000)}`);
    log.info('System start');

    //* enable cors
    // 允许跨域
    app.use(cors())
    app.options("*", cors())
    //* extend body limit to 10MB
    
    app.use(bodyParser.json({ limit: process.env.LimitbodyParser }))
    app.use(bodyParser.urlencoded({ limit: process.env.LimitbodyParser, extended: true }))

    
    //* Connect to MONGODB Database -> listen on PORT
    // 数据库
    mongoose
        .connect(process.env.DATABASE_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
        .then((__, err) => {
            if (!err) {
                console.log("Connected to PACS Mongo Database")
            } else {
                console.log(err)
                console.log(`${APP_NAME} V${VERSION_NUMBER} - ${moment.utc().format("LLL")} - FAILED TO RUN`)
            }
        })
        .finally(() => {
            startWatching("donor_infos");
        })
        

    let PORT = process.env.PORT || 8080
    app.listen(PORT, () => {
        uptime = moment.utc()
        log.info(`${APP_NAME} V${VERSION_NUMBER} running from ${uptime.format("LLL")} on PORT ${PORT}`)
        log.info('System started');
    })

    // cron job schedule
    cron.initScheduleJobs();
    await aganda.init();

    //* HEALTH CHECKER
    app.get("/", (_, res) => {
        res.send({
            active: true,
            message: `${APP_NAME} V${VERSION_NUMBER} is up and running from ${uptime.format("LLL")}`,
            initiationTS: uptime,
            activeSince: `${moment.utc().diff(uptime, "seconds")} Seconds`,
        })
    })

    // RoutingList of group
    const AppRouter = require("./routes/app")
    AppRouter.RoutingList(app)

    // Graceful shutdown
    process.on("SIGINT", async () => {
        console.log("SIGINT received. Cleaning up...");
        await closeAllChangeStreams();
        disconnectedClients();
        mongoose.connection.close()
            .then(() => {
                console.log("MongoDB connection closed.");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Error while closing MongoDB connection:", error);
                process.exit(1);
            });
    });
});