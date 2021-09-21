import * as utils from "../utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";
import { tmpDir } from "../utils";
import { execSync } from "child_process";

export async function judge(submission: any, problemConf: any) {

    let cnt = 0;
    let time = 0;
    let memory = 0;

    uoj.updateStatus(submission['id'], `Judging With Your Input`);


    let resValue = await ssb.value('../../work/hack.input') as string;
    let invalid = resValue.startsWith('FAIL');


    let details: string;
    let score = 1;


    if(invalid) {
        details = `<test num="-1" score="0" time="0" memory="0" info="Invalid Input">
        <in>${fs.readFileSync(tmpDir(`/work/hack.input`)).toString().substr(0, 100)}</in>
        <out></out>
        <res>${resValue}</res>
        </test>`
    } else {
        let res: any = await ssb.judge(`../work/hack.input`, problemConf.time_limit, problemConf.memory_limit);

        time = res['time']
        memory = Math.max(memory, res['memory'])

        let status;

        switch(res['status']) {
            case 1: status = 'Wrong Answer'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

        await ssb.std(problemConf.time_limit, problemConf.memory_limit);

        execSync(`chmod 777 ${tmpDir('/work/std.result')}`)

        let chkResult: string;
        try {
            chkResult = await ssb.check(`../work/hack.input`, `../work/std.result`) as string;
        } catch (e) {
            chkResult = "chk.cpp runtime error: " + e;
        }

        if (chkResult.startsWith("ok")) {
            status = 'Accepted';
            score = 100;
        }

        details = `<tests><test num="-1" score="${score}" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
            <in>${fs.readFileSync(utils.tmpDir('/work/hack.input')).toString().substr(0, 100)}</in>
            <out>${fs.readFileSync(utils.tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
            <res>${chkResult}</res></test></tests>`
    }

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}