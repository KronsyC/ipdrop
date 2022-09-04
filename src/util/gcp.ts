import {Storage} from "@google-cloud/storage"
import path from "path";

console.log(__dirname);

const gc = new Storage({
    keyFilename: path.join(process.env.ROOT, "gcp_credentials.json"),
    projectId: "ringed-valor-361417",
});
const bucket = gc.bucket("ipdrop_filestorage")
export {gc as storage, bucket};