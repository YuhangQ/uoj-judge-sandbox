import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import * as path from "path";
import { exec, execSync } from "child_process";
import { conf } from "./config";
import * as fs from "fs";
import * as ssb from "./sandbox/sandbox";
import { cmp, readProblemConf } from "./utils";

let judging = false;

function tmpDir(uri: string = "") {
    return path.join(__dirname, "../tmp", uri)
}

async function onSubmission(submission: any) {

    judging = true;

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

    uoj.updateStatus(submission['id'], 'Compiling\n')
    await ssb.compile();

    uoj.updateStatus(submission['id'], 'Running\n')

    //await ssb.judge('pre1.in', problemConf.time_limit, problemConf.memory_limit)



    let cnt = 0;
    let time = 0;
    let memory = 0;
    for(let i=1; i<=problemConf.n_tests; i++) {
        let res: any = await ssb.judge(`pre${i}.in`, problemConf.time_limit, problemConf.memory_limit);

        if(cmp(tmpDir('/work/answer.result'), 
        tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            cnt++;
        }
        time += res['time']
        memory += res['memory']
    }

    let score = Math.floor(cnt / problemConf.n_tests * 100)




    let data = await uoj.iteract({
        submit: true,
        id: submission['id'],
        result: {
            score: score,
            time: Math.floor(time / 1000000),
            memory: Math.floor(memory/1024),
            status: "Judged",
            details: "test"
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
        onSubmission(submission);
    })
    
}
setInterval(checkForNewSubmission, 1000);