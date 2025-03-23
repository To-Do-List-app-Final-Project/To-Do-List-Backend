const dayjs = require("dayjs")
const isBetween = require("dayjs/plugin/isBetween");
dayjs.extend(isBetween);
const util = require("./util")

/**
 * Get current time as UTC
 * 
 * @returns DateTime
 */
const getNowUTC = () => {
    return dayjs().utc().toDate();
}

/**
 * Check date which is without time
 * 
 * @param {*} date 
 * @returns 
 */
const dateWithoutTime = (date) => {
    const dDate = dayjs(date);
    return dDate.hour() === 0 && dDate.minute() === 0 && dDate.second() === 0 && dDate.millisecond() === 0;
}

/**
 * Converting date to start/end date of client TZ
 * 
 * @param {*} tz 
 * @param {*} date 
 * @param {*} type 
 * @returns 
 */
const clientDateTS = (tz, date, type, isAdd) => {
    let dateTZ = dayjs(date);
    
    if(util.isEmpty(tz)) {
        dateTZ = type === "start" ? dateTZ.startOf("day") : dateTZ.endOf("day");
    } else {
        if(isAdd) { dateTZ = dateTZ.add(parseInt(tz), "hour"); }
        if(type === "end") {
            dateTZ = dateTZ.endOf("day").subtract(parseInt(tz), "hour").utc();
        } else if(type === "start") {
            dateTZ = dateTZ.startOf("day").subtract(parseInt(tz), "hour").utc();
        }
    }

    return new Date(dateTZ.format("YYYY-MM-DD HH:mm:ss"));
}

/**
 * Get today start by client TZ to UTC+0
 *
 * @returns string
 */
const getTodayStartDateTZ = (req) => {
    const clientTS = req.headers.timezone
    return clientDateTS(clientTS, dayjs().toDate(), "start", true);
}

/**
 * Get today end by client TZ to UTC+0
 *
 * @returns string
 */
const getTodayEndDateTZ = (req) => {
    const clientTS = req.headers.timezone
    return clientDateTS(clientTS, dayjs().toDate(), "end", true);
}

/**
 * Get date's start time
 * 
 * @param {*} date 
 * @returns string
 */
const getDateStartTZ = (req, date) => {
    if (util.isEmpty(date)) { return null }

    const clientTS = req.headers.timezone
    return clientDateTS(clientTS, dayjs(date).toDate(), "start", !dateWithoutTime(date));
}

/**
 * Get date's end time
 * 
 * @param {*} date 
 * @returns string
 */
const getDateEndTZ = (req, date) => {
    if (util.isEmpty(date)) { return null }

    const clientTS = req.headers.timezone
    return clientDateTS(clientTS, dayjs(date).toDate(), "end", !dateWithoutTime(date));
}

/**
 * Get date's time
 * 
 * @param {*} date 
 * @returns string
 */
const getDateTimeTZ = (req, date) => {
    if (util.isEmpty(date)) { return null }

    const clientTS = req.headers.timezone
    if(util.isEmpty(clientTS)) {
        return new Date(dayjs(date).format("YYYY-MM-DD HH:mm:ss"));
    }
    // UTC day subtract center timezone
    const tzDate = dayjs(date).subtract(parseInt(clientTS), "hour").utc();
    return new Date(tzDate.format("YYYY-MM-DD HH:mm:ss"));
}

/**
 * Query client timezone's range date
 * 
 * @param {*} query 
 * @param {*} start 
 * @param {*} end 
 * @param {*} fieldName
 * @returns 
 */
const queryRangeDateTZ = (query, start, end, fieldName) => {
    if (util.isEmpty(start) && util.isEmpty(end)) { return query }

    if (util.notEmpty(start) && util.isEmpty(end)) {
        query[fieldName] = { $gte: start }
        return query
    }

    if (util.isEmpty(start) && util.notEmpty(end)) {
        query[fieldName] = { $lte: end }
        return query
    }

    query[fieldName] = { $gte: start, $lte: end }

    return query;
}

/**
 * Query client timezone's range date
 * 
 * @param {*} req 
 * @param {*} query 
 * @param {*} fromDate 
 * @param {*} toDate 
 * @param {*} fieldName 
 * @returns 
 */
const queryFromDateToDateTZ = (req, query, fromDate, toDate, fieldName) => {
    let start = getDateStartTZ(req, fromDate);
    let end = getDateEndTZ(req, toDate);

    return queryRangeDateTZ(query, start, end, fieldName);
}

/**
 * query client timezone's range datetime
 * 
 * @param {*} req 
 * @param {*} query 
 * @param {*} fromDate 
 * @param {*} toDate 
 * @param {*} fieldName 
 * @returns 
 */
const queryFromTimeToTimeTZ = (req, query, fromDate, toDate, fieldName) => {
    let start = getDateTimeTZ(req, fromDate)
    let end = getDateTimeTZ(req, toDate)

    return queryRangeDateTZ(query, start, end, fieldName);
}

/**
 * Query fullday with client timezone
 * 
 * @param {*} req 
 * @param {*} query 
 * @param {*} timeStr 
 * @param {*} fieldName 
 * @returns 
 */
const queryADayTimeTZ = (req, query, timeStr, fieldName) => {
    if (util.isEmpty(timeStr)) { return query }

    let start = getDateStartTZ(req, timeStr)
    let end = getDateEndTZ(req, timeStr)

    query[fieldName] = { $gte: start, $lte: end, }

    return query
}

const isTodayTZ = (req, date) => {
    const start = getTodayStartDateTZ(req);
    const end = getTodayEndDateTZ(req);

    const isToday = dayjs(date).isBetween(start, end, null, "[]");
    return isToday;
}

module.exports = {
    getNowUTC, queryADayTimeTZ, isTodayTZ,
    getTodayStartDateTZ, getTodayEndDateTZ,
    getDateStartTZ, getDateEndTZ, getDateTimeTZ,
    queryFromDateToDateTZ, queryFromTimeToTimeTZ
}