import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import { Request as ExpressRequest, Response } from "express";
import { OperationUsage } from "@pinecone-database/pinecone/dist/data/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (
  !process.env.PINECONE_API_KEY ||
  typeof process.env.PINECONE_API_KEY !== "string"
) {
  throw new Error("Pinecone API key is not defined or is not a string.");
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });


type OpenAIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
};

interface RequestWithChatId extends ExpressRequest {
  userChatId?: string;
}

interface ChatEntry {
  role: string;
  content: string;
}


export const chatResponseTrigger = async (req: RequestWithChatId, res: Response) => {
  try {
    let userChatId = req.body.chatId || generateChatId();
    let clientDetailsSubmitStatus = req.body.clientDetailsSubmitStatus;
    let language = req.body.language;

   

    const index = pc.index("botdb");
    const namespace = index.namespace("legalCRM-vector-store");

    let chatHistory: OpenAIMessage[] = req.body.messages || [];
    const userQuestion = extractLastUserMessage(chatHistory);

    // ================================================
    //  chat id and chat user message can get from here  
    //  to store in db each time message came 
    //  ===============================================
     console.log("userChatId : ", userChatId)
      console.log("userQuestion : ", userQuestion)

    if (!userQuestion) {
      return res.status(400).json({ error: "No user message found." });
    }

    updateUserMessage(chatHistory, userQuestion);


    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userQuestion,
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
    console.log("context : ", context)

    chatHistory = formatChatHistory(chatHistory, context, clientDetailsSubmitStatus, language, userQuestion);
    // prependSystemMessage(chatHistory, context);

    console.log("======================================= ")
    console.log("chatHistory : ", chatHistory)

    const completion = await openai.chat.completions.create({
      messages: chatHistory,
      model: "gpt-4o-mini",
      max_tokens: 300,
      temperature: 0,
    });



    const botResponse = completion.choices[0]?.message.content?.trim() || "No response from model.";
     // ================================================
    //  bot message can get from here to store in db
    //  ===============================================
    console.log("botResponse : ", botResponse)
    chatHistory.push({ role: "assistant", content: botResponse });

    res.json({
      answer: botResponse,
      chatHistory,
      chatId: userChatId,
    });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};


function generateChatId() {
  const currentDate = new Date();
  const formatDate = (unit: number) => `0${unit}`.slice(-2);
  const prefix = "chat";
  return `${prefix}_${currentDate.getFullYear()}${formatDate(currentDate.getMonth() + 1)}${formatDate(currentDate.getDate())}_${formatDate(currentDate.getHours())}${formatDate(currentDate.getMinutes())}${formatDate(currentDate.getSeconds())}`;
}

function extractLastUserMessage(chatHistory: OpenAIMessage[]): string {
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === "user") {
      return chatHistory[i].content;
    }
  }
  return "";
}

function updateUserMessage(chatHistory: OpenAIMessage[], userQuestion: string) {
  const lastUserIndex = chatHistory.map(entry => entry.role).lastIndexOf("user");
  if (lastUserIndex !== -1) {
    chatHistory[lastUserIndex].content = userQuestion;
  }
}



function formatChatHistory(chatHistory: OpenAIMessage[], context: string, clientDetailsSubmitStatus: boolean, language:string, userQuestion: string, ): OpenAIMessage[] {

  const message1 = language === "Spanish" 
  ?  "Lo siento, no se encontró información en el contexto proporcionado."
  : "Sorry, no information was found in the provided context.";

  const message2 = language === "Spanish" 
  ?  "Lo siento, no puedo proporcionar esa información."
  : "Sorry, I can't provide that information.";

  const message3 = language === "Spanish" 
  ?  "¿Está buscando elegir un agente de marketing para su caso?"
  : "Looking to choose a marketing agent for your case?";

  const message4 = language === "Spanish" 
  ?  "Se seleccionará el agente de marketing. Un experto se comunicará con usted dentro de las próximas 24 horas."
  : "The marketing agent will be selected. An expert will contact you within the next 24 hours.";

  const message5 = language === "Spanish" 
  ?  "Le proporcionaremos la información solicitada en las próximas 24 horas. Mientras tanto, le rogamos que nos proporcione sus datos de contacto para que podamos contactarle si es necesario."
  : "We will provide you with the requested information within the next 24 hours. In the meantime, please provide your contact information so we can contact you if necessary.";
  


  console.log("clientDetailsSubmitStatus : ", clientDetailsSubmitStatus)
  const conversationHistory = chatHistory
    .filter(msg => msg.role !== "system")
    .slice(-5);

  const sysPrompt: OpenAIMessage = {
    role: "system",
    content: `You are "Asistente de JN Marketing Strategy", a warm and friendly assistant at "JN Marketing Strategy." Always greet users kindly when they start a conversation, making them feel welcome. Respond in ${language}, keeping your replies polite, concise (under 150 words), and informative based on the provided context.

If the requested information is not found in the given context, respond with: "${message1}"

Strictly do not use public information to answer any questions. If asked, respond with: "${message2}"

If a user inquires about legal support, representation, or contacting someone from the agency, ask: "${message3}" If they confirm, say: "${message4}".  ${!clientDetailsSubmitStatus ? `If a user asks for private information (location, information about owner, any contact details) about JN Legal Marketing, say: ${message5}` : ''}



Maintain a smooth and helpful experience for the user at all times.

-----
CONTEXT: ${context}

-----------
ANSWER:
`,
  };

  return [sysPrompt, ...conversationHistory];
}