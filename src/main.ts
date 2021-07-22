import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import * as path from "path";
import { execSync } from "child_process";
import { conf } from "./config";
import * as fs from "fs";
import * as ssb from "./sandbox/sandbox";
import { sleep } from "sleep";
import { tmpDir, readProblemConf, readSubmissionConf } from "./utils";

// import judgers
import * as normalJudger from "./judger/normal";
import * as customJudger from "./judger/custom";
import * as sampleJudger from "./judger/sample";

let submissionBuffer: any = []

async function onSubmission(submission: any) {

    let problemConf = await prepareForFile(submission);
    let submissionConf = readSubmissionConf(tmpDir('/work/submission.conf'));


    let testSampleOnly = submissionConf.test_sample_only != undefined;
    let isCustomTest = (submission['is_custom_test'] != undefined)



    uoj.updateStatus(submission['id'], 'Compiling')
    let res: any = await ssb.compile();


    // When Compile Error
    if(res['code'] != 0) {
        await uoj.sendAndFetch(submission, 0, res['time'], res['memory'], 
        `<error>${fs.readFileSync(tmpDir('/work/compile.result')).toString()}</error>`, 
        "Compile Error").then((submission)=>{
            submissionBuffer.push(submission);
        });
        return;
    }

    uoj.updateStatus(submission['id'], 'Running')

    let judgeResult;
    if(isCustomTest) judgeResult = await customJudger.judge(submission, problemConf)
    else if(testSampleOnly) judgeResult = await sampleJudger.judge(submission, problemConf)
    else judgeResult = await normalJudger.judge(submission, problemConf)
    
    uoj.sendAndFetch(submission, judgeResult.score, judgeResult.time, judgeResult.memory, judgeResult.details, undefined);
}

async function prepareForFile(submission: any) {
    let id: number = submission['problem_id'];
    // get new data save to /tmp/data
    execSync(`rm -rf ${tmpDir('data/input/*')} && rm -rf ${tmpDir('data/output/*')}`)
    await uoj.download('/problem/' + id, tmpDir(`/data/${id}.zip`))
    execSync(`cd ${tmpDir('data')} && unzip -o ${id}.zip`)
    
    let problemConf = readProblemConf(tmpDir(`data/${id}/problem.conf`))


    execSync(`cd ${tmpDir(`data/${id}`)}\
    && mv ${problemConf.input_pre}*.${problemConf.input_suf} ../input/\
    && mv ${problemConf.output_pre}*.${problemConf.output_suf} ../output/\
    && mv ex_${problemConf.input_pre}*.${problemConf.input_suf} ../input/\
    && mv ex_${problemConf.output_pre}*.${problemConf.output_suf} ../output/`)


    execSync(`rm -rf ${tmpDir(`data/${id}*`)}`)

    execSync(`rm -rf ${tmpDir(`work/*`)}`)
    await uoj.download(submission['content']['file_name'] , tmpDir("/work/all.zip"))
    execSync(`cd ${tmpDir('work')} && unzip -o all.zip && rm -rf ./all.zip`)

    let submitConf: string = "";
    for(let item of submission['content']['config']) {
        submitConf += item[0] + " " + item[1] + '\n';
    }
    fs.writeFileSync(tmpDir("/work/submission.conf"), submitConf)

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
            if(submission != "Nothing to judge") {
                
                console.log('web get #' + submission['id'])
                submissionBuffer.push(submission);
            }
            resolve();
        })
    })
}

async function judgeLoop() {
    while(true) {
        await checkForNewSubmission();
        while(submissionBuffer.length != 0) {
            let submission = submissionBuffer.shift();
            //console.log("judging #" + submission['id'] );
            await onSubmission(submission)
            .catch(e=>uoj.sendAndFetch(submission, 0, 0, 0, 
                "<error>评测机遇到了错误，请联系管理员！</error>", "Judgement Failed"))
        }
        sleep(1);
    }
}
judgeLoop()
