import { green, yellow, red, blue, cyan, grey } from "colors/safe"

export class logger {
    public static info(msg: string) {
        console.log(`[${this.getTimeStamp()}][INFO] ${msg}`)
    }
    public static warn(msg: string) {
        console.log(yellow(`[${this.getTimeStamp()}][WARN] ${msg}`))
    }
    public static error(msg: string) {
        console.log(red(`[${this.getTimeStamp()}][ERROR] ${msg}`))
    }
    private static getTimeStamp() {
        return new Date().toUTCString();
    }
}

