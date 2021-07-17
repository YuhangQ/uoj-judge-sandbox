import * as axios from "axios";
import * as FormData from "form-data";
import * as uoj from "./webapi/uoj";
import * as path from "path";
import { exec } from "child_process";
import { conf } from "./config";
import * as fs from "fs";

let judging = false;

function workdir(uri: string) {
    return path.join(conf.workdir, uri);
}

async function onSubmission(submission: any) {
    let id: number = submission['problem_id'];
    await uoj.download('/problem/' + id, path.join(workdir("/data"), id + '.zip'))
    await uoj.download(submission['content']['file_name'] , path.join(workdir("/work"), 'all.zip'))

    exec(`cd ${workdir("/work")}\
    && unzip all.zip\
    && rm -rf ./*.zip`)

    let submitConf: string = "";
    for(let item of submission['content']['config']) {
        submitConf += item[0] + " " + item[1] + '\n';
    }
    fs.writeFileSync(path.join(workdir("/work"), 'submission.conf'), submitConf)
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
        onSubmission(submission);
    })
}
setInterval(checkForNewSubmission, 1000);