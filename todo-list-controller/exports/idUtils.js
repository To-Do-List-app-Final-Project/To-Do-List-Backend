
const getUuid = () => {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let count = 0;
const countId = () => {
    return '' + ++count;
}

//返回11位随机数字,基于毫秒，再随机两位(不重复)
const getTtid = () => {
    // let timeStr = dayjs().format("YYMMDDHHmm.ssSSS")
    // let timeStrList = timeStr.split(".")

    // //随机两位
    // let tail = randomRange(100, 999)
    // let rsp = parseInt(timeStrList[0]) + parseInt(timeStrList[1]) + tail

    // return String(rsp) + String(randomRange(0, 9))

    let tlong = new Date().getTime() - 1577808000000;
    let left = Math.floor(tlong / 1000);
    let right = tlong % 1000;
    let tail = Math.floor(Math.random() * 99999999);

    let r = (left % 1000000 + right + tail) % 100000000;
    let num = '' + Math.floor(left / 1000000) + r;
    return ('0000000' + num).slice(-11);
}

/**
 * 生成11位数字字符串
 * @returns {string} 
 */
const getNumId = () => {
    return getTtid();
}

module.exports = {
    countId,
    getUuid,
    getTtid,
    getNumId,
}
