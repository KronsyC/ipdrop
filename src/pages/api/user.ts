import { NextApiRequest, NextApiResponse } from "next";
import JWT from "jsonwebtoken"
import prisma from "../../util/prisma";
import reqip from "request-ip"
export default async function userHandler(req:NextApiRequest, res:NextApiResponse){
    if(req.method !== "POST"){
        res.status(405).send(`Unsupported Method ${req.method}`)
        return
    }
    // user already has a token, error
    if(req.cookies.token){
        const user:any = JWT.verify(req.cookies.token, process.env.JWT_SECRET)
        res.status(400).send(`Already registered as user ${user.sub}`);

        // update all the posts based on the sticky property
        // this can be done asynchronously
        const ip = reqip.getClientIp(req);
        prisma.upload.updateMany({
            where: {
                ipAddr: {
                    equals: ip,
                },
                sticky: {
                    equals: true
                },
                ownerId: {
                    equals: user.sub
                }
            },
            data: {
                ipAddr: ip
            }
        })
        return
    }
    // Generate a new user object and token

    const user = await prisma.user.create({})
    console.log(`Creating user ${user.id}`);
    
    const token = JWT.sign({
        sub: user.id,
        iat: new Date().getTime()
    }, process.env.JWT_SECRET);


    res.status(201).send(token)

}