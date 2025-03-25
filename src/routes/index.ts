// routes/index.ts
import express, { Request, Response } from 'express';
import axios from "axios";
import QuickQuestion from '../../models/QuickQuestion';

const router = express.Router();
const FB_APP_ID = process.env.FB_APP_ID!;
const FB_APP_SECRET = process.env.FB_APP_SECRET!;
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI!;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;

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

router.get("/connect-facebook", (req: Request, res: Response) => {
    const SCOPES = "pages_show_list,pages_manage_metadata,pages_read_engagement,pages_read_user_content";
    const loginUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
        FB_REDIRECT_URI
    )}&scope=${SCOPES}&response_type=code`;

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
    // return res.send(code);
    try {
        const tokenResponse = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                redirect_uri: FB_REDIRECT_URI,
                code,
            },
        });

        // return res.json(tokenResponse.data);
        const userAccessToken = tokenResponse.data.access_token;
        console.log("userAccessToken", userAccessToken);

        const permissionsResponse = await axios.get(`https://graph.facebook.com/v22.0/me/permissions`, {
            headers: { Authorization: `Bearer ${userAccessToken}` },
        });
        console.log("User Permissions:", permissionsResponse.data);

        // return res.json(permissionsResponse.data);

        const pagesResponse = await axios.get(`https://graph.facebook.com/v22.0/me/accounts`, {
            headers: { Authorization: `Bearer ${userAccessToken}` },
        });
        // return res.json(pagesResponse.data);
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

router.post("/subscribe-page", async (req: Request, res: Response) => {
    const { pageId, accessToken } = req.body;
  
    if (!pageId || !accessToken) {
      return res.status(400).send("Missing pageId or accessToken");
    }
  
    try {
      await axios.post(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`, null, {
        params: { access_token: accessToken },
      });
  
      res.json({ message: `Page ${pageId} subscribed successfully!` });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error subscribing page");
    }
  });
  router.get("/connect-instagram", (req: Request, res: Response) => {
    const SCOPES = "user_profile,user_media,pages_show_list,pages_manage_metadata"; // Corrected scopes
    const loginUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
        INSTAGRAM_REDIRECT_URI
    )}&scope=${SCOPES}&response_type=code`;

    res.render("connect-instagram", { loginUrl });
});


router.get("/auth/instagram/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("Authorization failed.");

    try {

        const tokenResponse = await axios.post(`https://api.instagram.com/oauth/access_token`, {
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: INSTAGRAM_REDIRECT_URI,
            code,
        });

        const userAccessToken = tokenResponse.data.access_token;
        console.log("Instagram user access token:", userAccessToken);

        const instagramAccountResponse = await axios.get(`https://graph.instagram.com/me`, {
            params: { access_token: userAccessToken },
        });

        const instagramAccountId = instagramAccountResponse.data.id;
        console.log("Instagram Account ID:", instagramAccountId);

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

        const instagramResponse = await axios.get(`https://graph.facebook.com/v22.0/${selectedPageId}?fields=instagram_business_account`, {
            headers: { Authorization: `Bearer ${selectedPageToken}` },
        });

        const instagramBusinessAccount = instagramResponse.data.instagram_business_account;

        // if (instagramBusinessAccount) {
        //     const instagramBusinessAccountId = instagramBusinessAccount.id;
        //     console.log("Instagram Business Account ID:", instagramBusinessAccountId);

        //     // Step 5: Subscribe Instagram Business Account to your chatbot
        //     await subscribeInstagramToChatbot(instagramBusinessAccountId, selectedPageToken);

        //     res.json({
        //         message: "Instagram Business Account connected and subscribed to chatbot.",
        //         instagramBusinessAccountId,
        //     });
        // } else {
        //     res.send("Instagram Business Account not found for the selected page.");
        // }
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.send("Failed to connect Instagram.");
    }
});
async function subscribeInstagramToChatbot(instagramAccountId: string, pageAccessToken: string) {
    try {
        const response = await axios.post(`https://graph.facebook.com/v22.0/${instagramAccountId}/subscribed_apps`, null, {
            params: { access_token: pageAccessToken },
        });

        console.log(`Instagram Account ${instagramAccountId} subscribed to chatbot.`);
        return response.data;
    } catch (error) {
        console.error("Error subscribing Instagram account:", error.response?.data || error.message);
        throw new Error("Failed to subscribe Instagram account.");
    }
}
export default router;
