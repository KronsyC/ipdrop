import {Storage} from "@google-cloud/storage"
import path from "path";


const gc = new Storage({
    projectId: process.env.PROJECT_ID,
    credentials: {
            private_key: process.env.PRIVATE_KEY,
            client_email: process.env.CLIENT_EMAIL
    }

});
const bucket = gc.bucket("ipdrop_filestorage")
export {gc as storage, bucket};