# cp_exit

在一些应用下，需要主进程创建出子进程，一般使用child_process的spawn或者exec来实现。当主进程异常终止时，如何能优雅的通知给子进程，让子进程做完收尾工作。

使用了egg-cluster的[graceful模块](https://www.npmjs.com/package/graceful-process)，并在其基础上做了windows的[兼容](https://github.com/nodejs/node/issues/12378)。 使用了[windows-kill](https://github.com/alirdn/windows-kill)。

## 说明

index.js中通过child_process创建了subprocess.js，在graceful中做了消息通信处理。

在index中特别运行了一个出错函数，模拟在主进程crash的时候，子进程可以收到消息，并执行自己的工作，然后退出。

## 测试方法

```
> node index.js

> pm2 start index.js --no-autorestart

> pm2 start index.js -i max --no-autorestart

```

然后去file-log.txt中查看

