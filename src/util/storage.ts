import path from "path";
import AWS from "aws-sdk"
import * as S3 from "@aws-sdk/client-s3"

const s3 = new S3.S3Client({
    region: "us-east-1",
})
const lb = new S3.ListBucketsCommand({})


const delete_file = async (file : string) => {
    const del = new S3.DeleteObjectCommand({
        Bucket: "ipdrop-storage",
        Key: file
    })
    return s3.send(del)
}

const upload_file = async (file : string, data : Buffer) => {
    const up = new S3.PutObjectCommand({
        Bucket: "ipdrop-storage",
        Key: file,
        Body: data
    })
    return s3.send(up)
}


const read_file = async (file : string) => {
    const read = new S3.GetObjectCommand({
        Bucket: "ipdrop-storage",
        Key: file
    })
    return s3.send(read)
}

export {
    delete_file,
    upload_file,
    read_file

}

// const s3 = new AWS.S3({
// })


// s3.
// // const gc = new Storage({
// //     projectId: process.env.PROJECT_ID,
// //     credentials: {
// //             private_key: process.env.PRIVATE_KEY,
// //             client_email: process.env.CLIENT_EMAIL
// //     }

// // });
// // const bucket = gc.bucket("ipdrop_filestorage")
// export {gc as storage, bucket};