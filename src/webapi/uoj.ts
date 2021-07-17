import * as fs from "fs";
import * as axios from "axios";
import * as FormData from "form-data";
import * as util from "util";
import * as stream from "stream";
import { conf } from "../config";


export function url(uri: string) {
    return `${conf.uoj_protocol}://${conf.uoj_host}${uri}`
}

const finished = util.promisify(stream.finished);
export async function download(uri: string, filename: string) {
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
    });
}