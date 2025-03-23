let cron = require('node-cron');
const dayjs = require("dayjs")



const initScheduleJobs = () => {
    const cronJobEveryDay = cron.schedule("59 59 23 * * *", async () => {
        console.log("Start Daily cron job");
        let today = dayjs().toDate();
    });
    cronJobEveryDay.start();
}

module.exports = { initScheduleJobs };