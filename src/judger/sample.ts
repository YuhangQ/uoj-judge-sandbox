import * as utils from "../utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";

export async function judge(submission: any, problemConf: any) {
    let cnt = 0;
    let time = 0;
    let memory = 0;

    let details = '<tests>'

    for(let i=1; i<=problemConf.n_sample_tests; i++) {
        uoj.updateStatus(submission['id'], `Judging Sample Test #${i}`);

        let res: any = await ssb.judge(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
        time += res['time']
        memory = Math.max(memory, res['memory'])

        let status;
        switch (res['status']) {
            case 1: status = 'Wrong Answer'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if(utils.outputTooMuch(utils.tmpDir('/work/answer.result'), 
        utils.tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            status = "Output Limit Exceeded";
        }
        if (res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';
        

        let chkResult: string;
        try {
            chkResult = await ssb.check(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, `ex_${problemConf.output_pre}${i}.${problemConf.output_suf}`) as string;
        } catch (e) {
            chkResult = "chk.cpp runtime error: " + e;
        }
        if (chkResult.startsWith("ok")) {
            status = 'Accepted';
            cnt++;
        }

        details += `<test num="${i}" score="${status == 'Accepted' ? "100" : "0"}" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
        <in>${fs.readFileSync(utils.tmpDir(`/data/input/ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
        <out>${fs.readFileSync(utils.tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
        <res>${chkResult}</res>
        </test>`
    }

    details += '</tests>';
    let score = Math.floor(cnt / problemConf.n_sample_tests * 100)

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}