import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import { Request as ExpressRequest, Response } from "express";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (
  !process.env.PINECONE_API_KEY ||
  typeof process.env.PINECONE_API_KEY !== "string"
) {
  throw new Error("Pinecone API key is not defined or is not a string.");
}

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

    let chatHistory: OpenAIMessage[] = req.body.messages || [];
    const userQuestion = extractLastUserMessage(chatHistory);

    if (!userQuestion) {
      return res.status(400).json({ error: "No user message found." });
    }

    updateUserMessage(chatHistory, userQuestion);

 
    prependSystemMessage(chatHistory);

    const completion = await openai.chat.completions.create({
      messages: chatHistory,
      model: "gpt-4",
      max_tokens: 100,
      temperature: 0,
    });

    

    const botResponse = completion.choices[0]?.message.content?.trim() || "No response from model.";
    console.log("botResponse : ",botResponse)
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

function prependSystemMessage(chatHistory: OpenAIMessage[]) {
  const sysPrompt = `You are Jane, a friendly and helpful assistant at 'The Legal Firm.' Always greet users warmly when they greet you. Respond to all questions politely and informatively, ensuring each answer is under 75 words. If you don’t know the answer, provide a plausible response. If the user’s request clearly implies they are seeking legal representation (e.g., asking about lawyer availability or services), ask, 'You want to choose a lawyer for your case?' If they confirm, reply with 'Lawyer selection will proceed.'`;

  chatHistory.unshift({
    role: "system",
    content: sysPrompt,
  });
}