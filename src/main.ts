import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import * as path from "path";
import { execSync } from "child_process";
import { conf } from "./config";
import * as fs from "fs";
import * as ssb from "./sandbox/sandbox";
import { cmp, outputTooMuch, readProblemConf } from "./utils";

let judging = false;

function tmpDir(uri: string = "") {
    return path.join(__dirname, "../tmp", uri)
}

async function onSubmission(submission: any) {

    judging = true;

    let problemConf = await prepareForFile(submission);

    uoj.updateStatus(submission['id'], 'Compiling')

    let res: any = await ssb.compile();

    // when compile error
    if(res['code'] != 0) {
        await uoj.iteract({
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
        })
        judging = false;
        return;
    }

    uoj.updateStatus(submission['id'], 'Running')

    let cnt = 0;
    let time = 0;
    let memory = 0;

    let details = '<tests>'

    for(let i=1; i<=problemConf.n_tests; i++) {
        uoj.updateStatus(submission['id'], `Judging Test #${i}`);
        let res: any = await ssb.judge(`pre${i}.in`, problemConf.time_limit, problemConf.memory_limit);
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
        <in>${fs.readFileSync(tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 20)}</in>
        <out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 20)}</out>
        <res>${right?'right!':fs.readFileSync(tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 20)}</res>
        </test>`
    }

    details += '</tests>';

    let score = Math.floor(cnt / problemConf.n_tests * 100)

    let data = await uoj.iteract({
        submit: true,
        id: submission['id'],
        result: {
            score: score,
            time: Math.floor(time / 1000000),
            memory: Math.floor(memory/1024),
            status: "Judged",
            details: details
        }
    })

    console.log("submited!" + data)

    judging = false;
}

/*
onSubmission({"id":48,"problem_id":1,"content":
{"file_name":"/submission/7274/1vuwQk9D0M1Vfr6wtizn",
"config":[["answer_language","C++"],["problem_id","1"]]},"problem_mtime":1626432690})
*/

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