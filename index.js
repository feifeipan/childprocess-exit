var fs = require("fs");
var child_process = require("child_process");
var os = require("os");
var path = require("path");
var L = require('console-file-log');
var logger = L({"append":true});

class main {
    constructor(){
        this.init();
    }

    init(){
        this.platformIsWin = os.platform == "win32" ? true : false;

        this.vAgent = child_process.fork("subprocess.js",[],{
            detached:true,
            cwd: process.cwd(),
            env: process.env,
            shell: true,
            stdio: 'ignore'
        });

        this.closed = false;

        this.vAgentPid = this.vAgent.pid;

        process.once('SIGINT', this.onSignal.bind(this, 'SIGINT'));
        // kill(3) Ctrl-\
        process.once('SIGQUIT', this.onSignal.bind(this, 'SIGQUIT'));
        // kill(15) default
        process.once('SIGTERM', this.onSignal.bind(this, 'SIGTERM'));

        process.once('exit', this.onExit.bind(this));
    }

    onSignal(signal) {
        if (this.closed) return;

        logger.info('[master] receive signal %s, closing', signal);
        this.close(signal);
      }

      onExit(code) {
        // istanbul can't cover here
        // https://github.com/gotwarlost/istanbul/issues/567
        const level = code === 0 ? 'info' : 'error';
        logger[level]('[master] exit with code:%s', code);
        this.close();
      }

    close(signal){
        signal = signal || "exit";
        this.closed = true;

        this.killAgentWorker(signal);
        // sleep 100ms to make sure SIGTERM send to the child processes
        logger.log('[master] send kill SIGTERM to app workers and agent worker, will exit with code:0 after 100ms');
        setTimeout(() => {
          logger.log('[master] close done, exiting with code:0');
          process.exit(100);
        }, 10000)
    }

    killAgentWorker(signal){

        if(this.platformIsWin){

            var pid = this.vAgentPid;
            var f = os.arch() == "x64" ? "kill64.exe" : "kill.exe";

            var killCmd = path.resolve(__dirname, "windows-signal/"+f);
            log("==killCmd==", killCmd);

            //only 2 signals(SIGINT and SIGBREAK) are supported on windows platform
            if(signal != "SIGINT"){
                signal = "SIGBREAK";
            }
            // killCmd+' -SIGBREAK '+pid
            var bat = child_process.spawnSync(killCmd, ['-'+signal,  pid]);

        }else{
            logger.log('[master] killAgentWorker');
            // fs.appendFileSync("temp.txt", "killAgentWorker\n");
            if (this.vAgent) {
                logger.log('[master] kill agent worker with signal SIGTERM');
                // fs.appendFileSync("temp.txt", "[master] kill agent worker with signal SIGTERM\n");
                this.vAgent.removeAllListeners();
                this.vAgent.kill('SIGTERM');
                if(os.platform() != "win32" && fs.existsSync(this.socketPath)){
                    // fs.appendFileSync("temp.txt", "[main] delete socketpath in killAgentWorker.\n");
                        logger.log("[main] delete socketpath in killAgentWorker." , this.randomPort);
                        fs.unlinkSync(this.socketPath);
                    }
            }
        }

    }
}


var m = new main();

/** test crash case **/
setTimeout(function(){
    a.b = "c";
},2000);

setInterval(()=>{}, 60*60*24);
