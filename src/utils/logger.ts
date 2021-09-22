import { green, yellow, red, blue, cyan, grey, bgBlue } from "colors/safe"


export function info(msg: string) {
    console.log(`[${getTimeStamp()}][INFO] ${msg}`)
}

export function warn(msg: string) {
    console.log(yellow(`[${getTimeStamp()}][WARN] ${msg}`))
}

export function error(msg: string) {
    console.log(red(`[${getTimeStamp()}][ERROR] ${msg}`))
}

export function important(msg: string) {
    console.log(bgBlue(`[${getTimeStamp()}][ERROR] ${msg}`))
}

export function raw(msg: string) {
    console.log(msg)
}

function getTimeStamp() {
    return new Date().toUTCString();
}

