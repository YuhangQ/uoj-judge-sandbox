import { tmpDir, readProblemConf, outputTooMuch, readSubmissionConf } from "../utils/utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";

export async function judge(submission: any, problemConf: any) {
    let time = 0;
    let memory = 0;

    let details = '<tests>'

    let submissionConf = readSubmissionConf(tmpDir('/work/submission.conf'));

    let withImplementer = (problemConf['with_implementer'] == 'on');
    let token = problemConf['token'];

    // normal judge
    let n_tests = problemConf.n_tests;

    let testInfo: any = [{}];

    for (let i = 1; i <= n_tests; i++) {

        uoj.updateStatus(submission['id'], `Judging Test #${i}`);

        if(submissionConf.validate_input_before_test == 'on') {
            let res = await ssb.value(`${problemConf.input_pre}${i}.${problemConf.input_suf}`) as string;
            let invalid = res.startsWith('FAIL');
            if(invalid) {
                details += `<test num="${i}" score="0" info="Invalid Input">
                <in>${fs.readFileSync(tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
                <out></out>
                <res>${res}</res>
                </test>`
                continue;
            }
        }


        let res: any = await ssb.judge(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);
        time += res['time']
        memory = Math.max(memory, res['memory'])


        let status;
        switch (res['status']) {
            case 1: status = 'Wrong Answer'; break;
            case 2: status = 'Time Limit Exceeded'; break;
            case 3: status = 'Memory Limit Exceeded'; break;
            default: status = 'No Comment';
        }
        if (outputTooMuch(tmpDir('/work/answer.result'),
            tmpDir(`/data/output/${problemConf.output_pre}${i}.${problemConf.output_suf}`))) {
            status = "Output Limit Exceeded";
        }
        if (res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';



        
        if(withImplementer) {
            let content = fs.readFileSync(tmpDir('/work/answer.result')).toString();
            if(content.startsWith(token)) content = content.substr(token.length, content.length-1);
            if(content.startsWith("\r\n")) content = content.substr(2, content.length-1);
            if(content.startsWith("\n")) content = content.substr(1, content.length-1);
            
            fs.writeFileSync(tmpDir('/work/answer.result'), content);
        }


        let chkResult: string;
        try {
            chkResult = await ssb.check(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, `${problemConf.output_pre}${i}.${problemConf.output_suf}`) as string;
        } catch (e) {
            chkResult = "chk.cpp runtime error: " + e;
        }

        if (chkResult.startsWith("ok")) {
            status = 'Accepted';
        }

        testInfo.push({
            num: i,
            ac: status == 'Accepted',
            info: status,
            time: Math.floor(res['time'] / 1000000),
            memory: res['memory'] / 1024,
            input: fs.readFileSync(tmpDir(`/data/input/${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100),
            output: fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100),
            result: chkResult
        })
    }

    let chkResult: string = "No Checker Output";


    let result = calculateResult(testInfo, problemConf)
    let score = result.score;
    details += result.details;


    // extra test
    if (score == 100) {
        let extraSuccess = true;
        let status: string = "Unkown";
        let i;
        for (i = problemConf.n_sample_tests + 1; i <= problemConf.n_ex_tests; i++) {
            uoj.updateStatus(submission['id'], `Judging Extra Test #${i}`);


            if(submissionConf.validate_input_before_test == 'on') {
                let res = await ssb.value(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`) as string;
                let invalid = res.startsWith('FAIL');
                if(invalid) {
                    details += `<test num="-1" score="0" info="Extra Test Invalid Input">
                    <in>${fs.readFileSync(tmpDir(`/data/input/ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
                    <out></out>
                    <res>${res}</res>
                    </test>`
                    continue;
                }
            }

            let res: any = await ssb.judge(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, problemConf.time_limit, problemConf.memory_limit);

            switch (res['status']) {
                case 1: status = 'Wrong Answer'; break;
                case 2: status = 'Time Limit Exceeded'; break;
                case 3: status = 'Memory Limit Exceeded'; break;
                default: status = 'No Comment';
            }
            if (res['status'] == 1 && res['code'] != '0') status = 'Runtime Error';

            chkResult = ""

            if(withImplementer) {
                let content = fs.readFileSync(tmpDir('/work/answer.result')).toString();
                if(content.startsWith(token)) content = content.substr(token.length, content.length-1);
                if(content.startsWith("\r\n")) content = content.substr(2, content.length-1);
                if(content.startsWith("\n")) content = content.substr(1, content.length-1);
                
                fs.writeFileSync(tmpDir('/work/answer.result'), content);
            }
            
            if(status == 'Wrong Answer') {
                try {
                    chkResult = await ssb.check(`ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`, `ex_${problemConf.output_pre}${i}.${problemConf.output_suf}`) as string;
                } catch (e) {
                    chkResult = "chk.cpp runtime error: " + e;
                }
            }

            if (chkResult.startsWith("ok")) {
                status = 'Accepted';
            } else {
                extraSuccess = false;
                break;
            }
            
        }
        if (extraSuccess) {
            details += '<test num="-1" score="0" info="Extra Test Passed" time="-1" memory="-1"><in></in><out></out><res></res></test>'
        } else {
            score = 97;
            details += `<test num="-1" score="-3" info="Extra Test Failed : ${status} on ${i}" time="-1" memory="-1">
            <in>${fs.readFileSync(tmpDir(`/data/input/ex_${problemConf.input_pre}${i}.${problemConf.input_suf}`)).toString().substr(0, 100)}</in>
            <out>${fs.readFileSync(tmpDir('/work/answer.result')).toString().substr(0, 100)}</out>
            <res>${chkResult}</res>
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

function calculateResult(testInfo: any, problemConf: any) {

    let details = "";

    let n_tests = problemConf.n_tests;
    let n_subtasks = problemConf.n_subtasks;


    let score = 0;

    let passed: any = {};

    if(n_subtasks) {
        let last = 0;
        for(let i=1; i<=n_subtasks; i++) {
            let info = "Accepted";
            for(let j=last+1; j<=problemConf['subtask_end_'+i]; j++) {
                if(!testInfo[j].ac) info = testInfo[j].info;
            }

            let dependence = problemConf['subtask_dependence_'+i];
            if(dependence) {
                let flag = true;
                if(dependence == "many") {
                    for(let j=1; ;j++) {
                        let d = problemConf[`subtask_dependence_${i}_${j}`];
                        if(d) {
                            if(!passed[d]) flag = false;
                        } else {
                            break;
                        }
                    }
                } else {
                    if(!passed[dependence]) flag = false;
                }

                details += `<subtask num="${i}" score="0" info="Skip">`
                details += `</subtask>`
                continue;
            }

            details += `<subtask num="${i}" score="${info=="Accepted"?problemConf['subtask_score_'+i]:0}" info="${info}">`

            for(let j=last+1; j<=problemConf['subtask_end_'+i]; j++) {
                details += `<test num="${testInfo[j].num}" score="${testInfo[j].ac?100:0}" info="${testInfo[j].info}" time="${testInfo[j].time}" memory="${testInfo[j].memory}">
                <in>${testInfo[j].input}</in>
                <out>${testInfo[j].output}</out>
                <res>${testInfo[j].result}</res>
                </test>`
            }

            details += `</subtask>`

            last = problemConf['subtask_end_'+i];
            score += info=="Accepted"?problemConf['subtask_score_'+i]:0;

            passed[i] = (info=="Accepted")
        }
    } else {

        let cnt = 0;
        for(let i=1; i<=n_tests; i++) {
            if(testInfo[i].ac) cnt++;
            details += `<test num="${testInfo[i].num}" score="${testInfo[i].ac?100:0}" info="${testInfo[i].info}" time="${testInfo[i].time}" memory="${testInfo[i].memory}">
                <in>${testInfo[i].input}</in>
                <out>${testInfo[i].output}</out>
                <res>${testInfo[i].result}</res>
                </test>`
        }
        score = Math.round(100.0 / n_tests * cnt)
    }

    return {
        details: details,
        score: score
    }
}