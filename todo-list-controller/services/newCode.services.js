const {
    PREFIX
} = require("../exports/literal");
const categories = require("../models/categories");
const tasks = require("../models/tasks");

const Util = require("../exports/util")

const getNewCategoriesCode = async () => {
    const lastExc = await categories.findOne({}).sort({ _id: -1 })
        .catch((err) => { throw err });

    let inc = 1;
    if(Util.notEmpty(lastExc) && Util.notEmpty(lastExc.code) 
        && String(lastExc.code).includes(PREFIX.CATEGORY)
    ) {
        let codeNum = String(lastExc.code).replace(PREFIX.CATEGORY, '');
        inc = parseInt(codeNum) + 1;
    }

    return PREFIX.CATEGORY + "" + String(inc).padStart(6, 0);
}

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
    getNewCategoriesCode,
    getNewTasksCode
}