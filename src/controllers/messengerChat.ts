import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { OperationUsage } from "@pinecone-database/pinecone/dist/data/types";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (
  !process.env.PINECONE_API_KEY ||
  typeof process.env.PINECONE_API_KEY !== "string"
) {
  throw new Error("Pinecone API key is not defined or is not a string.");
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const MESSENGER_VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
const MESSENGER_ACCESS_TOKEN = process.env.MESSENGER_ACCESS_TOKEN;

type OpenAIMessage = {
    role: "user" | "assistant" | "system";
    content: string;
    name?: string; 
  };

  
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

export const sendReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
    const body = req.body;
    if (body.object === "page") {
        for (const entry of body.entry) {
            const event = entry.messaging[0];

            if (event.message && event.message.text) {
                const senderId = event.sender.id;
                const messageText = event.message.text;

                let aiResponse = await getOpenAIResponse(senderId, messageText);

                if(aiResponse.toLowerCase() == 'this is a lead'){
                    await sendLeadButton(senderId);
                }
                else{
                    await sendMessage(senderId, aiResponse);
                }
                
            }
            if(event.postback && event.postback.payload){
                const senderId = event.sender.id;
                const payload = event.postback.payload;
                if (payload === 'YES_CONTACT'){
                  await sendLeadDetailsRequest(senderId);
                }
                else if (payload === 'NO_CONTACT'){
                  await sendMessage(senderId, "Okay, if you have further questions, feel free to ask!");
                }
              }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
    }
    catch (error) {
    console.log(error);
    return res.json({status:"failed", message:`${error}`})
    }
};

async function getOpenAIResponse(senderId: string,messageText: string) {
    const index = pc.index("botdb");
    const namespace = index.namespace("legalCRM-vector-store");

    const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: messageText,
    });

    let queryResponse: { matches: any; namespace?: string; usage?: OperationUsage | undefined; };
       queryResponse = await namespace.query({
         vector: embedding.data[0].embedding,
         topK: 2,
         includeMetadata: true,
       });
       const results: string[] = [];
         // console.log("CONTEXT : ", queryResponse.matches[0].metadata);
         queryResponse.matches.forEach((match: { metadata: { Title: any; Text: any; }; }) => {
           if (match.metadata && typeof match.metadata.Title === "string") {
             const result = `Title: ${match.metadata.Title}, \n  Content: ${match.metadata.Text} \n \n `;
             results.push(result);
           }
         });
       let context = results.join("\n");
       console.log("context : ",context)

    const sysPrompt = `You are Jane, a friendly and helpful assistant at "The Marketing Firm." Greet users warmly when they initiate a conversation. Respond to all questions politely and informatively based on the provided context, answering in English. Ensure each response is concise, under 75 words.
    
        If a user requests legal support or information about representation, say exactly, "this is a lead".
        
        If you don’t have specific information, provide a plausible response while staying within the guidelines. To improve client experience, collect information from the prospect as part of the process. Additionally, if lawyers allow, inform the prospect of the office phone number and email for direct contact. Always ensure the process is smooth and helpful.
        
        Do not use any special formatting, such as bold, italics, or symbols like **, *, _, or ~. Present all text in plain format.
        
        -----
        CONTEXT: ${context}
        
        -----------
        ANSWER:
        1. Title: Description
        2. Title: Description
        3. Title: Description
        ...`

       // Get OpenAI response
       const aiResponse = await openai.chat.completions.create({
           model: "gpt-4",
           messages: [
               { role: "system", content: sysPrompt },
               { role: "user", content: messageText }
           ],
           max_tokens: 100,
       });
   
       return aiResponse.choices[0].message.content|| 'no context';

  }

  async function sendMessage(senderId: string, message: string) {

    console.log(message);
    const requestBody = {
        recipient: { id: senderId },
        message: { text: message }
    };

    await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });
}

async function sendLeadButton(senderId: string){
    const requestBody = {
      recipient: { id: senderId },
      messaging_type: "RESPONSE",
      message: {
        text: "Would you like us to contact you regarding your legal inquiry?",
        quick_replies: [
          {
            content_type: "text",
            title: "Yes",
            payload: "YES_CONTACT"
          },
          {
            content_type: "text",
            title: "No",
            payload: "NO_CONTACT"
          }
        ]
      }
    };
  
    await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
  }
  async function sendLeadDetailsRequest(senderId: string){
    const  requestBody = {
        recipient: { id: senderId },
        message: {
            text: `Hello! To better assist you, please provide the following information: \n\n
                    1. **Full Name**: \n
                    2. **Case Description**: \n
                    3. **Phone Number**: \n
                    4. **Email Address**: \n\n
                    Please reply with the requested information, and we will get in touch with you as soon as possible.`
        }
    };
  
    await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${process.env.MESSENGER_ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });
  }