var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');

/********** CONFIGS **********/

var BUCKET_NAME = 'BUCKET_NAME';
var WEBPAGE = '';
var PHANTOM_BINARY = 'phantomjs';

/********** HELPERS **********/

var filepath = function (url) {
    var tokens = url.split('/')
    var l = tokens.length
    return tokens[l - 2] + "_" + tokens[l - 1].split('?')[0] + ".jpeg"
}
var s3 = new AWS.S3();

var save_to_s3 = function (payload, path, context) {
    var param = {
        ACL: 'public-read',
        Bucket: BUCKET_NAME,
        Key: path,
        ContentType: 'image/jpeg',
        Body: payload
    };
    s3.upload(param, function (err, data) {
        if (err) {
            context.fail(err);
        } else {
            context.succeed("https://s3-eu-west-1.amazonaws.com/" + BUCKET_NAME + "/" + filepath(url));
        }
    });
};

/********** MAIN **********/

exports.handler = function (event, context) {

    url = event.url + "?is_robot=true"
    viewportSize = event.viewportSize || {width: 1280, height: 768}
    clipRect = event.clipRect || {top: 70, left: 0, width: 1280, height: 768}
    // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

    // Set the path to the phantomjs binary
    var phantomPath = path.join(__dirname, PHANTOM_BINARY);

    // Arguments for the phantom script
    var processArgs = [
        path.join(__dirname, 'phantom-script.js'),
        url,
        JSON.stringify(viewportSize),
        JSON.stringify(clipRect)
    ];

    var params = {
        Bucket: BUCKET_NAME,
        Key: filepath(url)
    };
    s3.headObject(params, function (err, metadata) {
        if (err && err.code === 'NotFound') {
            // Launch the child process
            childProcess.execFile(phantomPath, processArgs, {maxBuffer: 1024 * 5000}, function (error, stdout, stderr) {
                if (error) {
                    context.fail(error);
                    return;
                }
                if (stderr) {
                    context.fail(error);
                    return;
                }

                // Decode base64 string that comes back from the child process
                var buffer = new Buffer(stdout, 'base64')
                save_to_s3(buffer, filepath(url), context);
            });
        } else {
            context.succeed("https://s3-eu-west-1.amazonaws.com/" + BUCKET_NAME + "/" + filepath(url));
        }
    });


}

