import * as fs from "fs";
import * as axios from "axios";
import * as FormData from "form-data";
import * as util from "util";
import * as stream from "stream";
import { conf } from "../config";


export function url(uri: string) {
    return `${conf.uoj_protocol}://${conf.uoj_host}${uri}`
}

export function updateStatus(id: number, status: string, is_custom_test = false) {
    if(is_custom_test) {
        iteract({
            'update-status': true,
            'id': id,
            'status': status,
            'is_custom_test': true
        })
    } else {
        iteract({
            'update-status': true,
            'id': id,
            'status': status
        })
    }
    
}

const finished = util.promisify(stream.finished);
export async function download(uri: string, filename: string) {
    return new Promise((resolve: any, reject: any) => {
        const auth = new FormData.default();
        auth.append('judger_name', conf.judger_name);
        auth.append('password', conf.judger_password);
        const writer = fs.createWriteStream(filename);
        axios.default({
            url: url("/judge/download" + uri),
            method: 'POST',
            responseType: 'stream',
            data: auth,
            headers: auth.getHeaders()
        }).then(async (response: any) => {
            response.data.pipe(writer);
            return finished(writer);
        }).then(resolve);
    });
}

export async function iteract(obj: any) {
    return new Promise((resolve: any, reject: any) => {
        const auth = new FormData.default();
        auth.append('judger_name', conf.judger_name);
        auth.append('password', conf.judger_password);

        for(let key in obj) {
            console.log('---------------------')
            if(typeof(obj) == 'object') {
                auth.append(key.toString(), JSON.stringify(obj[key]));
                //console.log(JSON.stringify(obj))
            } else {
                auth.append(key.toString(), obj[key].toString());
            }
        }

        //console.log(auth)

        axios.default({
            url: url("/judge/submit"),
            method: 'POST',
            data: auth,
            headers: auth.getHeaders()
        }).then((res)=>{
            console.log(res.status)
            resolve(res.data)
        });
    });
}