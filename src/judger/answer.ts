import { tmpDir, readProblemConf, outputTooMuch, readSubmissionConf } from "../utils/utils";
import * as ssb from "../sandbox/sandbox";
import * as uoj from "../webapi/uoj";
import * as fs from "fs";

export async function judge(submission: any, problemConf: any) {

    let details = '<tests>'

    // normal judge
    let n_tests = problemConf.n_tests;
    let score = 0;

    for (let i = 1; i <= n_tests; i++) {

        uoj.updateStatus(submission['id'], `Judging Test #${i}`);


        let chkResult: string;
        try {
            chkResult = await ssb.check(`${problemConf.input_pre}${i}.${problemConf.input_suf}`, `${problemConf.output_pre}${i}.${problemConf.output_suf}`, `${problemConf.output_pre}${i}.${problemConf.output_suf}`) as string;
        } catch (e) {
            chkResult = "chk.cpp runtime error: " + e;
        }

        let status = 'Wrong Answer';

        let tscore = 0;

        if (chkResult.startsWith("ok")) {
            status = 'Accepted';
            tscore += 100.0 / n_tests;
        }
        if(chkResult.startsWith("points")) {
            let x = parseFloat(chkResult.split(" ")[1]);
            tscore = Math.floor((100.0 / n_tests) * Math.round(100 * x) / 100)
            if(tscore != 0) {
                status = 'Acceptable Answer'
            }
        }

        score += tscore;
        tscore = Math.round(tscore)

        details += `<test num="${i}" score="${tscore}" info="${status}" time="0" memory="0">
                <in>${fs.readFileSync(tmpDir(`/work/${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 100)}</in>
                <out>${fs.readFileSync(tmpDir(`/work/${problemConf.output_pre}${i}.${problemConf.output_suf}`)).toString().substr(0, 100)}</out>
                <res>${chkResult}</res>
                </test>`
    }

    details += '</tests>';


    return {
        score: Math.round(score),
        time: 0,
        memory: 0,
        details: details
    }
}