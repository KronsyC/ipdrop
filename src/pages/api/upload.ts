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
            max: 60*24*2 // 2 days
        }, // Time to expiry (minutes)
        sticky: "boolean",
        filename: "string"
    },
})
const validator = sch.buildValidator(bodySchema)

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '11mb' // Set desired value here
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
    if( req.method == "GET" )return await getUploads(req, res)
    res.status(405).send(`Unsupported Method ${req.method}`)
    return

    

}

async function createUpload(req:NextApiRequest, res:NextApiResponse){
    const ip = requestip.getClientIp(req)
    const tok:JWT.JwtPayload = JWT.decode(req.cookies.token) as any
    const body = req.body
    
    validator(body)
    if(validator.error){
        res.status(400).send(validator.error);
        return
    }

    console.log("Creating Upload with params", body);
    

    // Request Types:
    //  0: Raw file upload, expected base64
    //  1: URL expected string
    let uploadId:number;
    switch(body.type){
        case 0:{
            if(!body.filename){
                res.status(400).send("File uploads require a name")
                return
            }
            try{
            // File Upload, connect to GCP and generate a File Object in the DB
            const fileHash = nanoid()
            const fileRef = await prisma.file.create({
                data: {
                    bucketHash: fileHash,
                    name: body.filename
                }
            })
            const fileBuffer = Buffer.from(body.data, "base64");
            const file = bucket.file(fileHash);
            file.save(fileBuffer);
            uploadId = fileRef.id;
            }
            catch{
                res.status(500).send("Failed to upload file")
                return
            }

            
            
            break;
        }
        case 1:{
            // Url Uploads
            let url:string = body.data
            // if it doesnt contain a dot, it aint a url
            if(!url.includes(".")){
                res.status(400).send("Invalid URL Received");
                return
            }
            url=url.trim()
            if(!url.startsWith("http"))url = "https://"+url
            const urlObj = await prisma.url.create({
                data: {
                    href: url
                }
            })
            uploadId = urlObj.id
            break;
        }
        default:{
            res.status(400).send(`No resource type exists with the id ${body.type}`)
            return
        }



        
    }

    const expiry = new Date(new Date().getTime() + body.expiry*60*1000);

    const upload = await prisma.upload.create({
        data: {
            ipAddr: ip,
            expiryDate: expiry,
            dataId: uploadId,
            type: body.type,
            ownerId: tok.sub as unknown as number,
            title: body.title.trim(),
            sticky: body.sticky
        }
    })

    res.send(`Successfully Created a new Upload for ${ip}`);
}
async function getUploads(req:NextApiRequest, res:NextApiResponse){
    const ip = requestip.getClientIp(req);
    console.log(ip);
    
    const uploads = await prisma.upload.findMany({
        where: {
            ipAddr: {
                equals: ip
            }
        }
    })
    interface FileRef{
        hash: string;
        name: string;
    }
    interface Upload{
        type: number
        title: string
        data: string | FileRef // Shortened URL or download link
        expires: Date
        createdAt: Date
    }
    const formattedUploads:Upload[] = []
    for(let u of uploads){
        let data:string|FileRef;
        if(u.type == 0){
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
        else if(u.type == 1){
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
            createdAt: u.createdAt
        })
    }
    res.json(formattedUploads)

}