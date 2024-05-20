import JWT from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import * as storage from '../../../util/storage';
import prisma from '../../../util/prisma';
import reqip from "request-ip"

export default async function fileHandler(req: NextApiRequest, res: NextApiResponse) {
    
    if (req.method !== "GET") {
        res.status(405).send(`Unsuported Method ${req.method}`)
        return
    }
    if (!req.cookies.token) {
        res.status(403).send("Unauthorized")
        return
    }
    const ip = reqip.getClientIp(req);
    let fileId = req.query.fileid;
    if (Array.isArray(fileId)) fileId = fileId.join("")
    // Make sure the user has the right permissions
    const f = await prisma.file.findFirst({
        where: {
            bucketHash: {
                equals: fileId
            }
        }
    })
    if(!f){
        res.status(404).send("The requested file does not exist");
        return
    }
    const upload = await prisma.upload.findFirst({
        where: {
            type: {
                equals: 0
            },
            dataId: {
                equals: f.id
            }
        }
    })

    const uploadIp = upload.ipAddr;
    if (uploadIp !== ip) {
        res.status(403).send("You Do not have permission to access this file")
        return
    }
    
    const file = await storage.read_file(f.bucketHash)

    res.writeHead(200, {
        "content-length": file.ContentLength,
        "content-disposition": `attachment; filename="${f.name}"`,
    })
    res.write(await file.Body.transformToByteArray())

}