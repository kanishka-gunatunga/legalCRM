import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';

const MESSENGER_VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;

export const verifyWebhook = async (req: Request, res: Response, next: NextFunction) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === MESSENGER_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }

};