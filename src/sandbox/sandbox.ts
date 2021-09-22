import * as ssb from "/opt/sandbox-test/simple-sandbox/lib/index";
import * as path from "path";
import { readFileSync } from "fs";
import { tmpDir } from "../utils/utils";
import * as logger from "../utils/logger"

const terminationHandler = () => {
    //process.exit(1);
};

process.on('SIGTERM', terminationHandler);
process.on('SIGINT', terminationHandler);

export function workDir(uri: string = "") {
    return path.join("/sandbox/work", uri);
}

export async function value(inputFile: string) {
    logger.info("正在运行 value 测评")
    return new Promise((resolve: any, reject: any)=>{
        try {
            const rootfs = "/opt/sandbox-test/rootfs"
            const sandboxedProcess = ssb.startSandbox({
                hostname: "qwq",
                chroot: rootfs,
                mounts: [
                    {
                        src: path.join(__dirname, "../../tmp/data/input"),
                        dst: "/sandbox/input",
                        limit: 0
                    },
                    {
                        src: path.join(__dirname, "../../tmp/work"),
                        dst: "/sandbox/work",
                        limit: 1
                    }
                ],
                executable: "./val",
                parameters: ['./val'],
                environments: ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                stdin: tmpDir("/data/input/" + inputFile),
                stdout: tmpDir("/work/value.result"),
                stderr: tmpDir("/work/value.result"),
                time: 1 * 1000, // 1 minute, for a bash playground
                mountProc: true,
                redirectBeforeChroot: true,
                memory: 100 * 1024 * 1024, // 100MB
                process: 30,
                user: ssb.getUidAndGidInSandbox(rootfs, "root"),
                cgroup: "asdf",
                workingDirectory: "/sandbox/work"
            });
    
            // Uncomment these and change 'stdin: "/dev/stdin"' to "/dev/null" to cancel the sandbox with enter
            //
            // console.log("Sandbox started, press enter to stop");
            // var stdin = process.openStdin();
            // stdin.addListener("data", function (d) {
            //     sandboxedProcess.stop();
            // });
    
            sandboxedProcess.waitForStop().then(result => {
                logger.important("Your sandbox finished!" + JSON.stringify(result));
                let output = readFileSync(tmpDir("/work/value.result")).toString();
                resolve(output)
            });
        } catch (ex: any) {
            logger.error("Whooops! " + ex.toString());
            reject(ex);
        }
    })
}

export async function check(inputFile: string, ansFile: string, dataFile: string = 'answer.result') {
    logger.info("正在运行 check 测评")
    return new Promise((resolve: any, reject: any)=>{
        try {
            const rootfs = "/opt/sandbox-test/rootfs"
            const sandboxedProcess = ssb.startSandbox({
                hostname: "qwq",
                chroot: rootfs,
                mounts: [
                    {
                        src: path.join(__dirname, "../../tmp/data/input"),
                        dst: "/sandbox/input",
                        limit: 0
                    },
                    {
                        src: path.join(__dirname, "../../tmp/data/output"),
                        dst: "/sandbox/output",
                        limit: 0
                    },
                    {
                        src: path.join(__dirname, "../../tmp/work"),
                        dst: "/sandbox/work",
                        limit: 1
                    }
                ],
                executable: "./chk",
                parameters: ['./chk', workDir('../input/') + inputFile , dataFile , workDir('../output/') + ansFile],
                environments: ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                stdin: "/dev/stdin",
                stdout: tmpDir("/work/checker.result"),
                stderr: tmpDir("/work/checker.result"),
                time: 1 * 1000, // 1 minute, for a bash playground
                mountProc: true,
                redirectBeforeChroot: true,
                memory: 100 * 1024 * 1024, // 100MB
                process: 30,
                user: ssb.getUidAndGidInSandbox(rootfs, "root"),
                cgroup: "asdf",
                workingDirectory: "/sandbox/work"
            });
    
            // Uncomment these and change 'stdin: "/dev/stdin"' to "/dev/null" to cancel the sandbox with enter
            //
            // console.log("Sandbox started, press enter to stop");
            // var stdin = process.openStdin();
            // stdin.addListener("data", function (d) {
            //     sandboxedProcess.stop();
            // });
    
            sandboxedProcess.waitForStop().then(result => {
                logger.important("Your sandbox finished!" + JSON.stringify(result));
                resolve(readFileSync(tmpDir('/work/checker.result')).toString())
            });
        } catch (ex: any) {
            logger.error("Whooops! " + ex.toString());
            reject(ex);
        }
    })
}

export async function judge(inputfile: string, timeLimit: number, memLimit: number) {
    logger.info("正在运行 judge 测评")
    return new Promise((resolve: any, reject: any)=>{
        try {
            const rootfs = "/opt/sandbox-test/rootfs"
            const sandboxedProcess = ssb.startSandbox({
                hostname: "qwq",
                chroot: rootfs,
                mounts: [
                    {
                        src: path.join(__dirname, "../../tmp/data/input"),
                        dst: "/sandbox/input",
                        limit: 0
                    },
                    {
                        src: path.join(__dirname, "../../tmp/work"),
                        dst: "/sandbox/work",
                        limit: 1
                    },
                    {
                        src: path.join(__dirname, "../../scripts"),
                        dst: "/sandbox/scripts",
                        limit: 0
                    }],
                executable: "/bin/python3",
                parameters: ['/bin/python3', '/sandbox/scripts/judge_in_sandbox.py', inputfile],
                environments: ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                stdin: "/dev/stdin",
                stdout: "/dev/stdout",
                stderr: "/dev/stdout",
                time: timeLimit * 1000, // 1 minute, for a bash playground
                mountProc: true,
                redirectBeforeChroot: true,
                memory: memLimit * 1024 * 1024, // 100MB
                process: 30,
                user: ssb.getUidAndGidInSandbox(rootfs, "root"),
                cgroup: "asdf",
                workingDirectory: "/sandbox/work"
            });
    
            // Uncomment these and change 'stdin: "/dev/stdin"' to "/dev/null" to cancel the sandbox with enter
            //
            // console.log("Sandbox started, press enter to stop");
            // var stdin = process.openStdin();
            // stdin.addListener("data", function (d) {
            //     sandboxedProcess.stop();
            // });
    
            sandboxedProcess.waitForStop().then(result => {
                logger.important("Your sandbox finished!" + JSON.stringify(result));
                resolve(result)
            });
        } catch (ex: any) {
            logger.error("Whooops! " + ex.toString());
        }
    })
};


export async function std(timeLimit: number, memLimit: number) {
    logger.info("正在运行 std 测评")
    return new Promise((resolve: any, reject: any)=>{
        try {
            const rootfs = "/opt/sandbox-test/rootfs"
            const sandboxedProcess = ssb.startSandbox({
                hostname: "qwq",
                chroot: rootfs,
                mounts: [
                    {
                        src: path.join(__dirname, "../../tmp/data/input"),
                        dst: "/sandbox/input",
                        limit: 0
                    },
                    {
                        src: path.join(__dirname, "../../tmp/work"),
                        dst: "/sandbox/work",
                        limit: 1
                    },
                    {
                        src: path.join(__dirname, "../../scripts"),
                        dst: "/sandbox/scripts",
                        limit: 0
                    }],
                executable: "./std",
                parameters: ['./std'],
                environments: ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                stdin: tmpDir("/work/hack.input"),
                stdout: tmpDir("/work/std.result"),
                stderr: tmpDir("/work/std.result"),
                time: timeLimit * 1000, // 1 minute, for a bash playground
                mountProc: true,
                redirectBeforeChroot: true,
                memory: memLimit * 1024 * 1024, // 100MB
                process: 30,
                user: ssb.getUidAndGidInSandbox(rootfs, "root"),
                cgroup: "asdf",
                workingDirectory: "/sandbox/work"
            });
    
            // Uncomment these and change 'stdin: "/dev/stdin"' to "/dev/null" to cancel the sandbox with enter
            //
            // console.log("Sandbox started, press enter to stop");
            // var stdin = process.openStdin();
            // stdin.addListener("data", function (d) {
            //     sandboxedProcess.stop();
            // });
    
            sandboxedProcess.waitForStop().then(result => {
                logger.important("Your sandbox finished!" + JSON.stringify(result));
                resolve(result)
            });
        } catch (ex: any) {
            logger.error("Whooops! " + ex.toString());
        }
    })
};



export async function compile(withImplementer = false) {
    logger.info("正在运行 compile 编译")
    return new Promise((resolve: any, reject: any)=>{
        try {
            const rootfs = "/opt/sandbox-test/rootfs"
            const sandboxedProcess = ssb.startSandbox({
                hostname: "qwq",
                chroot: rootfs,
                mounts: [
                    {
                        src: path.join(__dirname, "../../tmp/work"),
                        dst: "/sandbox/work",
                        limit: 1
                    },
                    {
                        src: path.join(__dirname, "../../scripts"),
                        dst: "/sandbox/scripts",
                        limit: 0
                    }],
                executable: "/bin/python3",
                parameters: ['/bin/python3', '/sandbox/scripts/build_in_sandbox.py', withImplementer ? "withImplementer" : "", '>', 'answer.compile'],
                environments: ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                stdin: "/dev/stdin",
                stdout: "/dev/stdout",
                stderr: "/dev/stdout",
                time: 10 * 1000, // 1 minute, for a bash playground
                mountProc: true,
                redirectBeforeChroot: true,
                memory: 1000 * 1024 * 1024, // 100MB
                process: 30,
                user: ssb.getUidAndGidInSandbox(rootfs, "root"),
                cgroup: "asdf",
                workingDirectory: "/sandbox/work"
            });
    
            // Uncomment these and change 'stdin: "/dev/stdin"' to "/dev/null" to cancel the sandbox with enter
            //
            // console.log("Sandbox started, press enter to stop");
            // var stdin = process.openStdin();
            // stdin.addListener("data", function (d) {
            //     sandboxedProcess.stop();
            // });
            
            sandboxedProcess.waitForStop().then(result => {
                logger.important("Your sandbox finished!" + JSON.stringify(result));
                resolve(result)
            });
            
        } catch (ex: any) {
            logger.error("Whooops! " + ex.toString());
        }
    })
};
