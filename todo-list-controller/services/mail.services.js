const AWS = require('aws-sdk');

var ses = new AWS.SES({
    region: "us-east-1",
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    apiVersion: "2018-09-05",
});

const setPwdContent = (host, passcode, token, dymTxt) => {
    return `<p>Please click on this <a href='${host}/resetPassword?token=${token}' target="_blank">link</a> to ${dymTxt} your password</p>
    <p>Please key in your passcode to ${dymTxt} your password: ${passcode} </p>`;
}

const send = async (email, title, content) => {
    const destination = Array.isArray(email) ? email : [email];
    var params = {
        Destination: {
            ToAddresses: destination,
        },
        Message: {
            Body: {
                Html: {
                    Data: content,
                    Charset: "utf-8",
                }
            },
            Subject: {
                Data: title,
                Charset: "utf-8",
            },
        },
        Source: process.env.AWS_EMAIL_FROM,
    };

    var sendPromise = ses.sendEmail(params).promise();
    // Handle promise's fulfilled/rejected states
    var result = false;
    await sendPromise.then(function (data) {
            console.log("Email: " + email + ", MessageId: " + data.MessageId);
            result = true;
        }).catch(function (err) {
            console.log(err);
            result = false;
        });

    return result;
};

module.exports = { send, setPwdContent }