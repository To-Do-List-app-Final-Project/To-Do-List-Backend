function getDirPath() {
    let dirPath = __dirname
    dirPath = dirPath.replace(/\\/, "/")
    dirPath = dirPath.replace(/\/exports$/, "")
    return dirPath
}

module.exports = {
    VERSION: "1.0.9", //版本号

    //允许上传的文件类型
    allowedFileType: {
        png: "image/png",
        jpeg: "image/jpeg",
        gif: "image/gif",
        jpg: "image/jpeg",
        mp4: "video/mp4",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    ProductDir: getDirPath(),
    SampleShipmentMaxNum: 120, //单个sample shipment的最大容量
}
