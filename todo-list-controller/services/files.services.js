const AWS = require("aws-sdk")
const fs = require('fs');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
})

const downloadFile = (key, tmpPath) => {
    const params = {
        Bucket: process.env.AWS_S3_UPLOAD_BUCKET || "pacsystem",
        Key: `public-img/${key}`
    };

    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(tmpPath);
        s3.getObject(params)
            .createReadStream()
            .on('error', reject)
            .pipe(fileStream)
            .on('close', resolve);
    });
}

module.exports = { downloadFile }
