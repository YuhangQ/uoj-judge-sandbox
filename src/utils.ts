import * as fs from "fs"


export function cmp(file1: string, file2: string) {
    let content1 = fs.readFileSync(file1).toString().replace(/\n/g, '').replace(/\r/g, '')
    let content2 = fs.readFileSync(file2).toString().replace(/\n/g, '').replace(/\r/g, '');
    return content1 == content2
}

export function outputTooMuch(file1: string, file2: string) {
    let content1 = fs.readFileSync(file1).toString().replace(/\n/g, '').replace(/\r/g, '')
    let content2 = fs.readFileSync(file2).toString().replace(/\n/g, '').replace(/\r/g, '');
    return content1.length >= 100 && content1.length >= 2 * content2.length;
}

export function readSubmissionConf(file: string) {
    let lines = fs.readFileSync(file).toString().split('\n');
    let map: any = {};
    for(let line of lines) {
        map[line.split(' ')[0]] = line.split(' ')[1]
    }
    return {
        answer_language: map['answer_language'],
        problem_id: map['problem_id'],
        test_sample_only: map['test_sample_only']
    }
}

export function readProblemConf(file: string) {
    let lines = fs.readFileSync(file).toString().split('\n');
    let map: any = {};
    for(let line of lines) {
        map[line.split(' ')[0]] = line.split(' ')[1]
    }
    return {
        use_builtin_judger: map['use_builtin_judger'],
        use_builtin_checker: map['use_builtin_checker'],
        n_tests: parseInt(map['n_tests']),
        n_ex_tests: parseInt(map['n_ex_tests']),
        n_sample_tests: parseInt(map['n_sample_tests']),
        input_pre: map['input_pre'],
        input_suf: map['input_suf'],
        output_pre: map['output_pre'],
        output_suf: map['output_suf'],
        time_limit: parseInt(map['time_limit']),
        memory_limit: parseInt(map['memory_limit'])
    }
}