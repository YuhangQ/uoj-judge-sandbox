import * as utils from "../utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";

export async function judge(submission: any, problemConf: any) {
    let cnt = 0;
    let time = 0;
    let memory = 0;

    let details = '<tests>'

    // normal judge
    let n_tests = problemConf.n_tests;
    for(let i=1; i<=n_tests; i++) {

        uoj.updateStatus(submission['id'], `Judging Test #${i}`);

        let res: any = await ssb.judge(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
        time += res['time']
        memory = Math.max(memory, res['memory'])


        let status;
        switch(res['status']) {
            case 1: status = 'Wrong Answer'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if(utils.outputTooMuch(utils.tmpDir('/work/answer.result'), 
        utils.tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            status = "Output Limit Exceeded";
        }
        if(res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

        
        let chkResult = await ssb.check(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, `${problemConf.output_pre}${i}.${problemConf.output_suf}`) as string;


        
        details += `<test num="${i}" score="0" info="${status}" time="${Math.floor(res['time']/1000000)}" memory="${res['memory']/1024}">
        <in>${fs.readFileSync(utils.tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
        <out>${fs.readFileSync(utils.tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
        <res>${chkResult}</res>
        </test>`
    }

    let score = Math.floor(cnt / problemConf.n_tests * 100)

    

    // extra test
    if(score == 100) {
        let extraSuccess = true;
        let status: string = "Unkown";
        let i;
        for(i=problemConf.n_sample_tests+1; i<=problemConf.n_ex_tests; i++) {
            uoj.updateStatus(submission['id'], `Judging Extra Test #${i}`);
            let res: any = await ssb.judge(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);

            if(!utils.cmp(utils.tmpDir('/work/answer.result'), 
            utils.tmpDir(`/data/output/ex_${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
                extraSuccess = false;
            }
            switch(res['status']) {
                case 1: status = 'Accepted'; break;
                case 2: status = 'Time Limit Exceeded'; break;
                case 3: status = 'Memory Limit Exceeded'; break;
                default: status = 'No Comment';
            }
            if(status == 'Accepted' && !extraSuccess) status = 'Wrong Answer';

            if(status != 'Accepted') {
                extraSuccess = false;
                break;
            }
        }
        if(extraSuccess) {
            details += '<test num="-1" score="0" info="Extra Test Passed" time="-1" memory="-1"><in></in><out></out><res></res></test>'
        } else {
            score = 97;
            details += `<test num="-1" score="-3" info="Extra Test Failed : ${status} on ${i}" time="-1" memory="-1">
            <in>${fs.readFileSync(utils.tmpDir(`/data/input/ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
            <out>${fs.readFileSync(utils.tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
            <res>${fs.readFileSync(utils.tmpDir(`/data/output/ex_${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 20)}</res>
            </test>`
        }
    }

    


    details += '</tests>';
    

    return {
        score: score,
        time: time,
        memory: memory,
        details: details
    }
}