const {
    PREFIX
} = require("../exports/literal");
const tasks = require("../models/tasks");

const Util = require("../exports/util")

const getNewTasksCode = async () => {
    const lastExc = await tasks.findOne({}).sort({ _id: -1 })
        .catch((err) => { throw err });

    let inc = 1;
    if(Util.notEmpty(lastExc) && Util.notEmpty(lastExc.code) 
        && String(lastExc.code).includes(PREFIX.TASK)
    ) {
        let codeNum = String(lastExc.code).replace(PREFIX.TASK, '');
        inc = parseInt(codeNum) + 1;
    }

    return PREFIX.TASK + "" + String(inc).padStart(6, 0);
}

module.exports = {
    getNewTasksCode
}