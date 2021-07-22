import * as utils from "../utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";

export async function judge(submission: any, problemConf: any) {

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

    let details = `<tests><custom-test info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}"><out>${fs.readFileSync(utils.tmpDir('/work/answer.result')).toString().substr(0, 100)}</out></custom-test></tests>`
    let score = Math.floor(cnt / problemConf.n_tests * 100)

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}