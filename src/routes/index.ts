// routes/index.ts
import express, { Request, Response } from 'express';
import axios from "axios";
import QuickQuestion from '../../models/QuickQuestion';

const router = express.Router();
const FB_APP_ID = process.env.FB_APP_ID!;
const FB_APP_SECRET = process.env.FB_APP_SECRET!;
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI!;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;

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
    const SCOPES = "pages_show_list,pages_manage_metadata,pages_messaging";

    const loginUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}&scope=${SCOPES}&response_type=code`;

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

router.get("/auth/facebook/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("Authorization failed.");

    try {
        const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                redirect_uri: FB_REDIRECT_URI,
                code,
            },
        });

        const userAccessToken = tokenResponse.data.access_token;

        const pagesResponse = await axios.get(`https://graph.facebook.com/v22.0/me/accounts`, {
            headers: { Authorization: `Bearer ${userAccessToken}` },
        });

        const pages = pagesResponse.data.data;

        if (!pages || pages.length === 0) {
            return res.send("No pages found.");
        }

        const selectedPage = pages[0]; 
        const selectedPageToken = selectedPage.access_token;
        const selectedPageId = selectedPage.id;

        console.log("selectedPages", pages);
        // await axios.post(`https://graph.facebook.com/v22.0/${selectedPageId}/subscribed_apps`, null, {
        //     params: { access_token: selectedPageToken },
        // });


        // console.log("Auto-Connected to Page:", selectedPage.name);

         res.send(`selectedPages ${pages}`);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        console.error("Error:", error);
        res.send("Failed to connect.");
    }
});


router.get('/connect-instagram', (req: Request, res: Response) => {
    const FACEBOOK_APP_ID = "413295051459868";
    const REDIRECT_URI = "https://legal-crm.vercel.app/auth/instagram/callback";
    const SCOPES = "instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata";

    const loginUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&response_type=code`;

    res.render("connect-instagram", { loginUrl });
});


router.get("/auth/instagram/callback", async (req, res) => {
    const FACEBOOK_APP_ID = "413295051459868";
    const FACEBOOK_APP_SECRET = "d8f0b4f332f3a31464e5a64985ae7dfc";
    const REDIRECT_URI = "https://legal-crm.vercel.app/auth/instagram/callback";
    const code = req.query.code;
    if (!code) return res.send("Authorization failed.");

    try {

        const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
            },
        });

        const userAccessToken = tokenResponse.data.access_token;

        const pagesResponse = await axios.get(`https://graph.facebook.com/v22.0/me/accounts`, {
            headers: { Authorization: `Bearer ${userAccessToken}` },
        });

        const pages = pagesResponse.data.data;

        if (!pages || pages.length === 0) {
            return res.send("No Instagram Business Accounts found.");
        }

        const selectedPage = pages[0]; 
        const pageId = selectedPage.id;
        const pageAccessToken = selectedPage.access_token;

        const instaResponse = await axios.get(`https://graph.facebook.com/v22.0/${pageId}?fields=instagram_business_account`, {
            headers: { Authorization: `Bearer ${pageAccessToken}` },
        });

        const instagramBusinessAccountId = instaResponse.data.instagram_business_account?.id;

        if (!instagramBusinessAccountId) {
            return res.send("No Instagram Business Account linked to this page.");
        }

        await axios.post(`https://graph.facebook.com/v22.0/${instagramBusinessAccountId}/subscribed_apps`, null, {
            params: { access_token: pageAccessToken },
        });

        console.log("Auto-Connected to Instagram Business Account ID:", instagramBusinessAccountId);

        res.send(`Connected to Instagram Business Account: ${instagramBusinessAccountId}`);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.send("Failed to connect.");
    }
});
export default router;
