import { NextApiRequest, NextApiResponse } from 'next';
import getip from "request-ip"
export default async function handleGetIP(req:NextApiRequest, res:NextApiResponse){
    res.status(200).send(getip.getClientIp(req))
}