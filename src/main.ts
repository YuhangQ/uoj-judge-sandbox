import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import * as path from "path";
import { execSync } from "child_process";
import { conf } from "./config";
import * as fs from "fs";
import * as ssb from "./sandbox/sandbox";
import { cmp, outputTooMuch, readProblemConf, readSubmissionConf } from "./utils";

let judging = false;

function tmpDir(uri: string = "") {
    return path.join(__dirname, "../tmp", uri)
}

async function onSubmission(submission: any) {

    judging = true;

    let problemConf = await prepareForFile(submission);

    uoj.updateStatus(submission['id'], 'Compiling')

    let res: any = await ssb.compile();

    let isCustomTest = (submission['is_custom_test'] != undefined)
    let isContest = (submission['contest'] != undefined)

    // when compile error
    if(res['code'] != 0) {
        let submitData = {
            submit: true,
            id: submission['id'],
            result: {
                score: 0,
                time: Math.floor(res['time'] / 1000000),
                memory: Math.floor(res['memory']/1024),
                status: "Judged",
                error: "Compile Error",
                details: `<error>${fs.readFileSync(tmpDir('/work/compile.result')).toString()}</error>`
            }
        }
        if(isCustomTest) (submitData as any)['is_custom_test']  = true;
        await uoj.iteract(submitData)
        judging = false;
        return;
    }

    uoj.updateStatus(submission['id'], 'Running')



    let judgeResult;
    if(isCustomTest) judgeResult = await customJudge(submission, problemConf)
    if(isContest) judgeResult = await contestJudge(submission, problemConf)
    else judgeResult = await normalJudge(submission, problemConf)

    
    let submitData = {
        submit: true,
        id: submission['id'],
        result: {
            score: judgeResult.score,
            time: Math.floor(judgeResult.time / 1000000),
            memory: Math.floor(judgeResult.memory/1024),
            status: "Judged",
            details: judgeResult.details
        }
    }

    if(isCustomTest) (submitData as any)['is_custom_test']  = true;

    console.log(judgeResult.details)

    let data = await uoj.iteract(submitData)
    console.log("submited!" + data)

    judging = false;
}

async function contestJudge(submission: any, problemConf: any) {
    let cnt = 0;
    let time = 0;
    let memory = 0;

    let details = '<tests>'

    let n_tests = problemConf.n_tests;


    for(let i=1; i<=n_tests; i++) {
        //if(isCustomTest) uoj.updateStatus(submission['id'], `Judging With Your Input`);
        uoj.updateStatus(submission['id'], `Judging Test #${i}`);

        let res: any = await ssb.judge(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
        let right = false;


        if(cmp(tmpDir('/work/answer.result'), 
        tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            cnt++; right = true;
        }
        time += res['time']
        memory = Math.max(memory, res['memory'])

        let status;
        switch(res['status']) {
            case 1: status = 'Accepted'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if(status == 'Accepted' && !right) status = 'Wrong Answer';
        if(outputTooMuch(tmpDir('/work/answer.result'), 
        tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            status = "Output Limit Exceeded";
        }
        if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

        details += `<test num="${i}" score="${right?100:0}" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
        <in>${fs.readFileSync(tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
        <out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
        <res>${right?'right!':fs.readFileSync(tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 20)}</res>
        </test>`
    }

    details += '</tests>';
    let score = Math.floor(cnt / problemConf.n_tests * 100)

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}
async function normalJudge(submission: any, problemConf: any) {
    let cnt = 0;
    let time = 0;
    let memory = 0;

    let details = '<tests>'


    let submissionConf = readSubmissionConf(tmpDir('/work/submission.conf'));

    let testSampleOnly = submissionConf.test_sample_only != undefined;

    console.log('>>>>>>>>>>>>>>>' + testSampleOnly)


    // normal judge
    let n_tests = problemConf.n_tests;
    for(let i=1; i<=n_tests; i++) {
        // when samples only
        if(testSampleOnly) break;


        uoj.updateStatus(submission['id'], `Judging Test #${i}`);

        let res: any = await ssb.judge(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
        let right = false;


        if(cmp(tmpDir('/work/answer.result'), 
        tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            cnt++; right = true;
        }
        time += res['time']
        memory = Math.max(memory, res['memory'])

        let status;
        switch(res['status']) {
            case 1: status = 'Accepted'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if(status == 'Accepted' && !right) status = 'Wrong Answer';
        if(outputTooMuch(tmpDir('/work/answer.result'), 
        tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            status = "Output Limit Exceeded";
        }
        if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

        details += `<test num="${i}" score="${right?100:0}" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
        <in>${fs.readFileSync(tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
        <out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
        <res>${right?'right!':fs.readFileSync(tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 20)}</res>
        </test>`
    }


    if(testSampleOnly) {
        for(let i=1; i<=problemConf.n_sample_tests; i++) {
            uoj.updateStatus(submission['id'], `Judging Sample Test #${i}`);

            let res: any = await ssb.judge(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
            let right = false;


            if(cmp(tmpDir('/work/answer.result'), 
            tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
                cnt++; right = true;
            }
            time += res['time']
            memory = Math.max(memory, res['memory'])

            let status;
            switch(res['status']) {
                case 1: status = 'Accepted'; break;
                case 2: status = 'Time Limit Exceeded'; break;
                case 3: status = 'Memory Limit Exceeded'; break;
                default: status = 'No Comment';
            }
            if(status == 'Accepted' && !right) status = 'Wrong Answer';
            if(outputTooMuch(tmpDir('/work/answer.result'), 
            tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
                status = "Output Limit Exceeded";
            }
            if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

            details += `<test num="${i}" score="${right?100:0}" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
            <in>${fs.readFileSync(tmpDir(`/data/input/ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
            <out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
            <res>${right?'right!':fs.readFileSync(tmpDir(`/data/output/ex_${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 20)}</res>
            </test>`
        }
    }

    details += '</tests>';
    let score = Math.floor(cnt / problemConf.n_tests * 100)
    if(testSampleOnly) score = Math.floor(cnt / problemConf.n_sample_tests * 100)

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}

async function customJudge(submission: any, problemConf: any) {
    let cnt = 0;
    let time = 0;
    let memory = 0;

    uoj.updateStatus(submission['id'], `Judging With Your Input`);

    let res: any = await ssb.judge(`../work/input.txt`, problemConf.time_limit, problemConf.memory_limit);

    time = res['time']
    memory = Math.max(memory, res['memory'])

    let status;

    switch(res['status']) {
        case 1: status = 'Success'; break;
        case 2: status = 'Time Limit Exceeded'; break;
        case 3: status = 'Memory Limit Exceeded'; break;
        default: status = 'No Comment';
    }
    if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

    let details = `<tests><custom-test info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}"><out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100)}</out></custom-test></tests>`
    let score = Math.floor(cnt / problemConf.n_tests * 100)

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}

async function prepareForFile(submission: any) {
    let id: number = submission['problem_id'];
    // get new data save to /tmp/data
    execSync(`rm -rf ${tmpDir('data/input/*')} && rm -rf ${tmpDir('data/output/*')}`)
    await uoj.download('/problem/' + id, tmpDir(`/data/${id}.zip`))
    execSync(`cd ${tmpDir('data')} && unzip -o ${id}.zip`)
    
    let problemConf = readProblemConf(tmpDir(`data/${id}/problem.conf`))
    console.log(problemConf)

    execSync(`cd ${tmpDir(`data/${id}`)}\
    && mv *.${problemConf.input_suf} ../input/\
    && mv *.${problemConf.output_suf} ../output/`)
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

function checkForNewSubmission() {
    if(judging) return;
    const auth = new FormData.default();
    auth.append('judger_name', conf.judger_name);
    auth.append('password', conf.judger_password);
    axios.default.post(uoj.url("/judge/submit"), auth, { headers: auth.getHeaders() })
    .then((res: any) => {
        let submission = res.data;
        console.log(submission);
        if(submission == "Nothing to judge") return;
        judging = true;
        onSubmission(submission)
            .catch((e)=>{
                uoj.iteract({
                    submit: true,
                    id: submission['id'],
                    result: {
                        score: 0,
                        time: 0,
                        memory: 0,
                        status: "Judged",
                        error: "Judgement Failed",
                        details: `<error>评测机遇到了错误，请联系管理员！</error>`
                    }
                })
            });
    })
    
}
setInterval(checkForNewSubmission, 1000);