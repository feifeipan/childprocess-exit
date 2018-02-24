var fs = require("fs");
var graceful = require("./graceful");

const L = require('console-file-log');
const logger = L({"append":true});


graceful({
    // killTimeout:180000,
    killTimeout:3000,
    callback: function(){
        logger.info("graceful callback\n");
    }
});


setInterval(()=>{}, 60*60*24);
