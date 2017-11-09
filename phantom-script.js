var system = require('system');


var page = require('webpage').create();
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

var url = system.args[1];
var viewportSize = system.args[2];
var clipRect = system.args[3];

page.viewportSize = JSON.parse(viewportSize)
page.clipRect = JSON.parse(clipRect)


page.open(url, function start(status) {

    window.setTimeout(function () {
        var base64 = page.renderBase64('JPEG');
        system.stdout.write(base64);
        phantom.exit();
    }, 5000);
});