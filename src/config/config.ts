
import * as fs from "fs"

let conf = JSON.parse(fs.readFileSync(__dirname + "/../../../.conf.json").toString())

export { conf };