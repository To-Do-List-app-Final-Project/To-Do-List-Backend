const Agenda = require('agenda');
const dayjs = require("dayjs");
const LogServer = require("../services/log.service");

const jobName = {
    cleanUpJob: 'cleanup complete jobs',
};

// Init Connection
const db_connection_string = process.env.DATABASE_CONNECTION_STRING
const agenda = new Agenda({
    db: {
        address: `${db_connection_string}`,
        collection: 'agenda_jobs'
    }
});

// Start Agenda
const init = async () => {
    try {
        await agenda.start();
        console.log(`Agenda started! ${dayjs().toDate()}`);

        // agenda.every('0 0 * * *', jobName.cleanUpJob);

        return true
    } catch (err) {
        LogServer.error(null, "Agenda-Job init: " + err);
        return false;
    }
}

// agenda.define(jobName.cleanUpJob, async (job) => {
//     const todayStart = dayjs().add(15, "minute").startOf("day").toDate();
//     await agenda.cancel({ lastFinishedAt: { $lt: todayStart }, nextRunAt: null });

//     LogServer.info(null, `Successfully run job: ${ job.attrs.name }`);
// });

module.exports = { init };