process.on('SIGBREAK', function(){
	console.log('RECEIVE SIGBREAK');
});

setInterval(function(){}, 1000);

var fs = require('fs');
fs.writeFileSync('SendSignal.bat', 'kill64 -SIGBREAK ' + process.pid);
console.log('Process ID:', process.pid);