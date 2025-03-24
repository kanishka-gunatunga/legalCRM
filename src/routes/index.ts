// routes/index.ts
import express, { Request, Response } from 'express';
import axios from "axios";
import QuickQuestion from '../../models/QuickQuestion';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.render('intergratedBot');
});

router.get('/bot', async (req: Request, res: Response) => {
    const questions  = await QuickQuestion.findAll({});
    res.render('bot',{questions: questions});
});

router.get('/voice-bot', async (req: Request, res: Response) => {
    const questions  = await QuickQuestion.findAll({});
    res.render('audioBot',{questions: questions});
});

router.get('/live-agent', (req: Request, res: Response) => {
    res.render('liveAgent');
});

router.get('/voice-and-chat-bot', async (req: Request, res: Response) => {
    const questions  = await QuickQuestion.findAll({});
    res.render('index',{questions: questions});
});

router.get('/connect-facebook', (req: Request, res: Response) => {
    const FACEBOOK_APP_ID = "413295051459868";
    const REDIRECT_URI = "https://legal-crm.vercel.app/auth/callback";
    const SCOPES = "pages_show_list,pages_manage_metadata,pages_messaging";

    const loginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&response_type=code`;

    res.render("connect-facebook", { loginUrl });
});
router.get('/live-agent', (req: Request, res: Response) => {
    res.render('liveAgent');
});

router.get('/privacy-policy', (req: Request, res: Response) => {
    res.render('privacy-policy');
});
router.get('/terms-of-service', (req: Request, res: Response) => {
    res.render('terms-of-service');
});

router.get("/auth/callback", async (req, res) => {

    const FACEBOOK_APP_ID = "413295051459868";
    const FACEBOOK_APP_SECRET = "d8f0b4f332f3a31464e5a64985ae7dfc";
    const REDIRECT_URI = "https://legal-crm.vercel.app/auth/callback";
    const code = req.query.code;
    if (!code) return res.send("Authorization failed.");

    try {

        const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
            },
        });

        const userAccessToken = tokenResponse.data.access_token;

        const longLivedTokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                grant_type: "fb_exchange_token",
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                fb_exchange_token: userAccessToken,
            },
        });

        const longLivedUserToken = longLivedTokenResponse.data.access_token;
        const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
            headers: { Authorization: `Bearer ${longLivedUserToken}` },
        });

        const pages = pagesResponse.data.data;

        res.render("select-page", { pages, userAccessToken: longLivedUserToken });
    } catch (error) {
        console.error("Error during authentication:", error.response?.data || error.message);
        res.send("Authentication failed.");
    }
});

export default router;
