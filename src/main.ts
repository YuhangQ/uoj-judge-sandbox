import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import { execSync } from "child_process";
import { conf } from "./config/config";
import * as fs from "fs";
import * as ssb from "./sandbox/sandbox";;
import * as sampleJudger from "./judger/sample";
import * as hackJudger from "./judger/hack";
import { sleep } from "sleep";
import { tmpDir, readProblemConf, readSubmissionConf } from "./utils/utils";

// import judgers
import * as normalJudger from "./judger/normal";
import * as customJudger from "./judger/custom"
import * as answerJudger from "./judger/answer"
import { logger } from "./utils/logger";

let submissionBuffer: any = []

async function onSubmission(submission: any) {

    console.log(JSON.stringify(submission))
    let problemConf = await prepareForFile(submission);
    let submissionConf = readSubmissionConf(tmpDir('/work/submission.conf'));

    let testSampleOnly = submissionConf.test_sample_only != undefined;
    let isCustomTest = (submission['is_custom_test'] != undefined)
    let isHack = (submission['is_hack'] != undefined);

    let isAnswer = (problemConf.submit_answer == 'on')

    let withImplementer = (problemConf.with_implementer == 'on')


    if(!isAnswer) {
        uoj.updateStatus(submission['id'], 'Compiling')
        let res: any = await ssb.compile(withImplementer);

        // When Compile Error
        if(res['code'] != 0) {
            let newSubmission = await uoj.sendAndFetch(submission, 0, res['time'], res['memory'], 
            `<error>${fs.readFileSync(tmpDir('/work/compile.result')).toString()}</error>`, 
            "Compile Error");
            if(newSubmission) submissionBuffer.push(newSubmission);
            return;
        }
    }

    uoj.updateStatus(submission['id'], 'Running')

    let judgeResult;
    if(isCustomTest) judgeResult = await customJudger.judge(submission, problemConf);
    else if(isHack) judgeResult = await hackJudger.judge(submission, problemConf);
    else if(testSampleOnly) judgeResult = await sampleJudger.judge(submission, problemConf);
    else if(isAnswer)judgeResult = await answerJudger.judge(submission, problemConf);
    else judgeResult = await normalJudger.judge(submission, problemConf)
    
    let newSubmission = await uoj.sendAndFetch(submission, judgeResult.score, judgeResult.time, judgeResult.memory, judgeResult.details, undefined)
    if(newSubmission) submissionBuffer.push(newSubmission);
}

async function prepareForFile(submission: any) {
    let id: number = submission['problem_id'];
    // get new data save to /tmp/data
    execSync(`rm -rf ${tmpDir('data/*')}`)
    execSync(`rm -rf ${tmpDir(`work/*`)}`)
    execSync(`mkdir ${tmpDir(`data/input`)}`)
    execSync(`mkdir ${tmpDir(`data/output`)}`)


    await uoj.download('/problem/' + id, tmpDir(`/data/${id}.zip`))
    execSync(`cd ${tmpDir('data')} && unzip -o ${id}.zip`)
    
    let problemConf = readProblemConf(tmpDir(`data/${id}/problem.conf`))

    try {
    execSync(`cd ${tmpDir(`data/${id}`)}\
    && mv ${problemConf.input_pre}*.${problemConf.input_suf} ../input/\
    && mv ${problemConf.output_pre}*.${problemConf.output_suf} ../output/\
    && mv ex_${problemConf.input_pre}*.${problemConf.input_suf} ../input/\
    && mv ex_${problemConf.output_pre}*.${problemConf.output_suf} ../output/`)
    } catch(e: any) {}
    
    try {
        execSync(`mv ${tmpDir(`data/${id}/require/*`)} ${tmpDir('/work')}`)
    } catch(e: any) {}

    let checker = problemConf.use_builtin_checker
    if(checker) execSync(`cp ${tmpDir('../checkers')}/${checker} ${tmpDir('/work/chk')}`)
    else execSync(`mv ${tmpDir(`data/${id}`)}/chk ${tmpDir('/work/chk')}`)

    

    await uoj.download(submission['content']['file_name'] , tmpDir("/work/all.zip"))
    execSync(`cd ${tmpDir('work')} && unzip -o all.zip && rm -rf ./all.zip`)

    let submitConf: string = "";
    for(let item of submission['content']['config']) {
        submitConf += item[0] + " " + item[1] + '\n';
    }
    fs.writeFileSync(tmpDir("/work/submission.conf"), submitConf)

    try {
    execSync(`mv ${tmpDir(`data/${id}`)}/std ${tmpDir('/work/std')}`)
    execSync(`mv ${tmpDir(`data/${id}`)}/val ${tmpDir('/work/val')}`)
    } catch(e: any) {}

    if(submission['is_hack'] != undefined) {
        await uoj.download(submission['hack']['input'], tmpDir('/work/hack.input'));
        let hack = fs.readFileSync(tmpDir('/work/hack.input')).toString().replace(/\r/g, '');
        fs.writeFileSync(tmpDir('/work/hack.input'), hack)
    }

    return problemConf;
}


async function checkForNewSubmission() {
    return new Promise((resolve: any, reject: any)=>{
        const auth = new FormData.default();
        auth.append('judger_name', conf.judger_name);
        auth.append('password', conf.judger_password);

        axios.default.post(uoj.url("/judge/submit"), auth, { headers: auth.getHeaders() })
        .then((res: any) => {
            let submission = res.data;
            console.log(submission);
            if(submission != "Nothing to judge") {
                submissionBuffer.push(submission);
            }
            resolve();
        }).catch(reject)
    })
}

logger.info('正在准备启动')

process.on('SIGINT', ()=>{
    process.exit();
})



async function judgeLoop() {
    while(true) {
        try {
            await checkForNewSubmission();
        } catch(e) {
            logger.error("UOJ远程服务器无法连接，请检查网络或配置文件")
        }
        while(submissionBuffer.length != 0) {
            let submission = submissionBuffer.shift();
            await onSubmission(submission)
            .catch(e=>uoj.sendAndFetch(submission, 0, 0, 0, 
                `<error>评测机遇到了错误，请联系管理员！\n${e}</error>`, "Judgement Failed"))
        }
        sleep(1);
    }
}



(async ()=> {
logger.info('正在向远程服务器请求评测信息')
await judgeLoop()
})()

