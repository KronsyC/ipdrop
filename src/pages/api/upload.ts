import JWT from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { NextApiResponse, NextApiRequest } from 'next';
import Schematica from "schematica"
import { bucket } from '../../util/gcp';
import prisma from '../../util/prisma';
import requestip from "request-ip"

const sch = new Schematica();


const bodySchema = sch.createSchema({
    type: "object",
    required: [
        "title",
        "type",
        "data",
        "expiry",
        "sticky"
    ],
    properties: {
        title: "string",
        type: "number",
        data: "string",
        expiry: {
            type: "number",
            min: 5,
            max: 60 * 24 * 10 // 10 days
        }, // Time to expiry (minutes)
        sticky: "boolean",
        filename: "string",
        password: "string"
    },
})
const validator = sch.buildValidator(bodySchema)

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '20mb' // Set desired value here
        }
    }
}
export default async function handleUpload(req: NextApiRequest, res: NextApiResponse) {

    if (!req.cookies.token) {
        res.status(403).send("Unauthorized, please create a user first");
        return
    }
    try {
        JWT.verify(req.cookies.token, process.env.JWT_SECRET);
    }
    catch {
        res.status(400).send("A malformed token was received, don't be tampering you silly billy");
        return
    }
    if (req.method == "POST") return await createUpload(req, res)
    if (req.method == "GET") return await getUploads(req, res)
    if (req.method == "DELETE")return await deleteUpload(req, res);
    res.status(405).send(`Unsupported Method ${req.method}`)
    return



}
async function deleteUpload(req: NextApiRequest, res: NextApiResponse) {
    const target = req.query.id;
    const password = req.query.password
    if(target==undefined || Array.isArray(target) || isNaN(parseInt(target))){
        res.status(400).send("You must provide a valid deletion id");
        return
    }
    const id = parseInt(target);

    // attempt to fetch the post with the given id
    const post = await prisma.upload.findFirst({
        where: {
            id: {
                equals: id
            }
        }
    })
    if(!post){
        res.status(404).send("Failed to find post with id "+id);
        return
    }
    if(Array.isArray(password)){
        res.status(400).send("Cannot provide multiple passwords")
        return
    }
    // check ownership
    const user = JWT.decode( req.cookies.token)
    const sub = user.sub as unknown as number
    console.log(post);
    
    const tgt_password = post.password as string | undefined;
    if(post.ownerId !== sub && !(password && tgt_password && password == tgt_password)){
        // Check if the password is correct and matches
        res.status(403).send("Unauthorized to delete this upload");
        return
    }
    // Delete the upload entry and it's bucket file
    const del = await prisma.upload.delete({
        where: {
            id: id
        }
    })
    if(del.type == 0){
        // delete the file object
        const file = await prisma.file.delete({
            where: {
                id: del.dataId
            }
        })
        // Remove the file from the GCP Bucket
        const fileEntry = bucket.file(file.bucketHash);
        await fileEntry.delete();
    }
    else if(del.type == 1){
        // delete the url object
        const url = await prisma.url.delete({
            where: {
                id: del.dataId
            }
        })
    }
    res.send("Successfully deleted upload with id " + id);

}
async function createUpload(req: NextApiRequest, res: NextApiResponse) {
    const ip = requestip.getClientIp(req)

    console.log(`Incoming Request from ${ip}`);

    const tok: JWT.JwtPayload = JWT.decode(req.cookies.token) as any
    const body = req.body

    validator(body)
    if (validator.error) {
        res.status(400).send(validator.error);
        return
    }
    console.log("validated");




    // Request Types:
    //  0: Raw file upload, expected base64
    //  1: URL expected string
    let uploadId: number;
    switch (body.type) {
        case 0: {
            console.log("File Detected");

            if (!body.filename) {
                res.status(400).send("File uploads require a name")
                return
            }
            console.log("Has name");

            try {
                // File Upload, connect to GCP and generate a File Object in the DB
                const fileHash = nanoid()



                const fileBuffer = Buffer.from(body.data, "base64");
                const size = fileBuffer.byteLength
                const sizeInMb = size / 1024 / 1024
                console.log(`received file with ${sizeInMb}mb`);
                if (sizeInMb > 10) {
                    res.status(400).send("File Too Large")
                    return
                }


                const file = bucket.file(fileHash);
                const fileRef = await prisma.file.create({

                    data: {
                        bucketHash: fileHash,
                        name: body.filename
                    }
                })

                file.on("error", () => {
                    console.log("error");
                    res.status(500).send("GCP ERROR")

                })
                file.save(fileBuffer, {
                    gzip: true
                });
                uploadId = fileRef.id;
            }
            catch {
                res.status(500).send("Failed to upload file")
                return
            }



            break;
        }
        case 1: {
            console.log("URL Detected");
            // Url Uploads
            let url: string = body.data
            // if it doesnt contain a dot, it aint a url
            if (!url.includes(".")) {
                res.status(400).send("Invalid URL Received");
                return
            }
            url = url.trim()
            if (!url.startsWith("http")) url = "https://" + url
            const urlObj = await prisma.url.create({
                data: {
                    href: url
                }
            })
            uploadId = urlObj.id
            break;
        }
        default: {
            res.status(400).send(`No resource type exists with the id ${body.type}`)
            return
        }




    }
    const expiry = new Date(new Date().getTime() + body.expiry * 60 * 1000);

    // Password
    const password = body.password
    try {
        const upload = await prisma.upload.create({
            data: {
                ipAddr: ip,
                expiryDate: expiry,
                dataId: uploadId,
                type: body.type,
                ownerId: tok.sub as unknown as number,
                title: body.title.trim(),
                sticky: body.sticky,
                password: password
            }
        })
    }
    catch (err) {
        console.log("An error has been encountered");

        res.status(500).json(err)
    }


    res.send(`Successfully Created a new Upload for ${ip}`);
}
async function getUploads(req: NextApiRequest, res: NextApiResponse) {
    const ip = requestip.getClientIp(req);
    console.log(ip);

    const uploads = await prisma.upload.findMany({
        where: {
            ipAddr: {
                equals: ip
            },
            expiryDate: {
                gte: new Date()
            }
        }
    })
    interface FileRef {
        hash: string;
        name: string;
    }
    interface Upload {
        type: number
        title: string
        data: string | FileRef // Shortened URL or download link
        expires: Date
        createdAt: Date
        id: number
    }
    const formattedUploads: Upload[] = []
    for (let u of uploads) {
        let data: string | FileRef;
        if (u.type == 0) {
            const file = await prisma.file.findFirstOrThrow({
                where: {
                    id: {
                        equals: u.dataId
                    }
                }
            })
            data = {
                hash: file.bucketHash,
                name: file.name
            }
        }
        else if (u.type == 1) {
            const url = await prisma.url.findFirst({
                where: {
                    id: {
                        equals: u.dataId
                    }
                }
            })
            data = url.href
        }
        formattedUploads.push({
            type: u.type,
            data: data,
            expires: u.expiryDate,
            title: u.title,
            createdAt: u.createdAt,
            id: u.id
        })
    }

    res.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate")
    res.json(formattedUploads)

}
