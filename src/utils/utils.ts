import * as fs from "fs"
import * as path from "path"

export function tmpDir(uri: string = "") {
    return path.join(__dirname, "../../tmp", uri)
}

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
        test_sample_only: map['test_sample_only'],
        validate_input_before_test: map['validate_input_before_test'],
    }
}

export function readProblemConf(file: string) {
    let lines = fs.readFileSync(file).toString().split('\n');
    let map: any = {};
    for(let line of lines) {
        let value = line.split(' ')[1];
        map[line.split(' ')[0]] = parseInt(value) ? parseInt(value) : value;
    }
    map['input_pre'] = map['input_pre'] ? map['input_pre'] : "input";
    map['input_suf'] = map['input_suf'] ? map['input_suf'] : "txt"
    map['output_pre'] = map['output_pre'] ? map['output_pre'] : "output";
    map['output_suf'] = map['output_suf'] ? map['output_suf'] : "txt";

    return map;
}