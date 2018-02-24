/**modify from graceful-process**/
/**https://www.npmjs.com/package/graceful-process **/

'use strict';

const cluster = require('cluster');
const init = Symbol('graceful-process-init');
const os = require("os");
const L = require('console-file-log');
const logger = L({"append":true});

module.exports = (options = {}) => {
    // const logger = options.logger || console;
    const label = options.label || `graceful-process#${process.pid}`;
    const killTimeout = options.killTimeout || 60000;
    const callback = options.callback || false;
    if (process[init]) {
        logger.warn('[%s] graceful-process init already', label);
        return;
    }
    process[init] = true;

    // https://github.com/eggjs/egg-cluster/blob/master/lib/agent_worker.js#L35
    // exit gracefully
    process.once('SIGTERM', () => {
        // fs.appendFile("temp.txt", label + ' receive signal SIGTERM, exiting with code:0\n');
        logger.info('[%s] receive signal SIGTERM, exiting with code:0', label);

        setTimeout(function() {
            process.exit(0);
        }, killTimeout);
    });

    process.once('exit', code => {
        const level = code === 0 ? 'info' : 'error';
        // fs.appendFileSync("temp.txt", label + ' receive exit SIGTERM, exiting with code:'+level+'\n');
        logger[level]('[%s] exit with code:%s', label, code);
    });

    /******************************************************************************************/
    //windows can't receive exit signal, see https://github.com/nodejs/node/issues/12378  for detail.
    //we use windows-kill module for windows see https://github.com/alirdn/windows-kill
    process.on('SIGBREAK', function(){
        // fs.appendFileSync("temp.txt", "get SIGBREAK callback "+label+"\n");
        logger.log('RECEIVE SIGBREAK');
        setTimeout(function() {
            process.exit(0);
        }, killTimeout);
    });

    process.on('SIGINT', function(){
        // fs.appendFileSync("temp.txt", "get SIGINT callback "+label+"\n");
        logger.log('RECEIVE SIGINT');
        setTimeout(function() {
            process.exit(0);
        }, killTimeout);
    });
    /******************************************************************************************/


    process.on('message', function(msg) {
        logger.log("===msg:"+msg+"====");
        if (msg == 'shutdown') {
        logger.log('Closing all connections...');
        // fs.appendFile("temp.txt", label + ' receive disconnect event on child_process fork mode(windows)\n');
        setTimeout(function() {
            logger.log('Finished closing connections');
            process.exit(0);
        }, 1500);
        }
    });

    if (cluster.worker) {
        // cluster mode
        // fs.appendFileSync("temp.txt", label + 'cluster mode\n');
        // https://github.com/nodejs/node/blob/6caf1b093ab0176b8ded68a53ab1ab72259bb1e0/lib/internal/cluster/child.js#L28
        cluster.worker.once('disconnect', () => {
            // ignore suicide disconnect event
            // fs.appendFileSync("temp.txt", label + ' receive disconnect event in cluster fork mode, exitedAfterDisconnect:false\n');
            if (cluster.worker.exitedAfterDisconnect) return;
            logger.error('[%s] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false', label);
        });
    } else {
        // fs.appendFileSync("temp.txt", label + 'child_process mode\n');
        // child_process mode
        process.once('disconnect', () => {
            // wait a loop for SIGTERM event happen
            logger.error("receive disconnect event on child_process fork mode ")
            // fs.appendFile("temp.txt", label + ' receive disconnect event on child_process fork mode\n');

            setImmediate(() => {
                // if disconnect event emit, maybe master exit in accident
                // fs.appendFile("temp.txt", label + ' receive disconnect event on child_process fork mode, exiting with code:110\n');
                logger.error('[%s] receive disconnect event on child_process fork mode, exiting with code:110', label);
                setTimeout(function() {
                    process.exit(110);
                }, killTimeout);

                callback && callback();
            });
        });
    }
};
