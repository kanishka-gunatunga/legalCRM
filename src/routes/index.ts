// routes/index.ts
import express, { Request, Response } from 'express';
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
    res.render('connect-facebook');
});
router.post('/auth/facebook/connect', async (req, res) => {
    const { accessToken } = req.body;

    console.log(accessToken);
    if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required.' });
    }

    try {
        // // Get user's pages
        // const pagesResponse = await axios.get(
        //     `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
        // );

        // const pages = pagesResponse.data.data;

        // if (pages.length === 0) {
        //     return res.status(400).json({ error: 'No pages found.' });
        // }

        // // Select the first page (or implement page selection logic)
        // const pageId = pages[0].id;

        // // Get the page access token
        // const pageAccessTokenResponse = await axios.get(
        //     `https://graph.facebook.com/<span class="math-inline">\{pageId\}?fields\=access\_token&access\_token\=</span>{accessToken}`
        // );

        // const pageAccessToken = pageAccessTokenResponse.data.access_token;

        // // Store pageAccessToken and user ID securely (e.g., in a database)
        // // Example:
        // // database.storePageAccessToken(pageId, pageAccessToken, userId);

        // // Create a JWT token
        // const token = jwt.sign(
        //     { pageId: pageId, pageAccessToken: pageAccessToken },
        //     process.env.JWT_SECRET
        // );

        res.json({ message: 'Facebook connected successfully!', token: accessToken });
    } catch (error) {
        console.error('Error connecting Facebook:', error);
        res.status(500).json({ error: 'Failed to connect Facebook.' });
    }
});
export default router;
