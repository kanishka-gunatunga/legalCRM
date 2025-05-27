import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import { Request as ExpressRequest, Response } from "express";
import { Translate } from "@google-cloud/translate/build/src/v2";
import { OperationUsage } from "@pinecone-database/pinecone/dist/data/types";
import Question from '../../models/Question';
import BotChats from '../../models/BotChats';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (
  !process.env.PINECONE_API_KEY ||
  typeof process.env.PINECONE_API_KEY !== "string"
) {
  throw new Error("Pinecone API key is not defined or is not a string.");
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

interface RequestWithChatId extends ExpressRequest {
  userChatId?: string;
}
interface ChatEntry {
  role: string;
  content: string;
}

interface ResponseData {
  intentData: any[];
}



const translate = new Translate({
  key: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const chatFlowResponse = async (
  req: RequestWithChatId,
  res: Response
) => {
  // console.log("req : ", req.body.chatId)
  const index = pc.index("botdb");
  const namespace = index.namespace("dfcc-bot-knowledge");
  //dfcc-bot-knowledge

  let userChatId = req.body.chatId || "";
  let language = req.body.language;
  let cachedIntentsList: string[] = [];
  console.log("language", language);
  const questionArray = await Question.findAll({
    where: {
      language: language,
    },
    attributes: [
      'id',
      'question'
    ],
    group: ['question', 'id'], 
  });
  
  console.log("questionArray", questionArray);
  // const questionList = questionArray.map(item => item.dataValues.question);

  const questionList = questionArray.map((item) => ({
    question: item.question,
    id: item.id,
  }));

  //console.log(questionList);

  async function translateToEnglish(userQuestion: string) {
    const [translationsToEng] = await translate.translate(userQuestion, "en");
    const finalQuestion = Array.isArray(translationsToEng)
      ? translationsToEng.join(", ")
      : translationsToEng;
    return finalQuestion;
  }

  //console.log("language : ", language);
  let translatedQuestions: { question: string; id: any }[] = [];

  if (language === "sinhala") {
    translatedQuestions = await Promise.all(
      questionList.map(async (item) => {
        const translatedQuestion = await translateToEnglish(item.question!);
        return {
          question: translatedQuestion,
          id: item.id,
        };
      })
    );

    //console.log("translated questionList sinhala:", translatedQuestions);
  } else if (language === "tamil") {
    translatedQuestions = await Promise.all(
      questionList.map(async (item) => {
        const translatedQuestion = await translateToEnglish(item.question!);
        return {
          question: translatedQuestion,
          id: item.id,
        };
      })
    );

    //console.log("translated questionList tamil :", translatedQuestions);
  } else {
    translatedQuestions = await Promise.all(
      questionList.map(async (item) => {
        const translatedQuestion = await translateToEnglish(item.question!);
        return {
          question: translatedQuestion,
          id: item.id,
        };
      })
    );

    //console.log("translated questionList english:", translatedQuestions);
  }
  console.log(req.body.language);

  try {
    // chat id
    if (!userChatId) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
      const day = ("0" + currentDate.getDate()).slice(-2);
      const hours = ("0" + currentDate.getHours()).slice(-2);
      const minutes = ("0" + currentDate.getMinutes()).slice(-2);
      const seconds = ("0" + currentDate.getSeconds()).slice(-2);

      const prefix = "chat";
      userChatId = `${prefix}_${year}${month}${day}_${hours}${minutes}${seconds}`;

      // console.log("Generated chat id : ", userChatId);
    } else {
      // console.log("Existing chat id : ", userChatId);
    }

    //============= get question ======================
    // get user message with history
    let chatHistory = req.body.messages || [];

    // Get the user question from the chat history
    let userQuestion = "";
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].role === "user") {
        userQuestion = chatHistory[i].content;
        break;
      }
    }
    async function translateToEnglish(userQuestion: string) {
      const [translationsToEng] = await translate.translate(userQuestion, "en");
      const finalQuestion = Array.isArray(translationsToEng)
        ? translationsToEng.join(", ")
        : translationsToEng;
      return finalQuestion;
    }

    let translatedQuestion = "";
    // console.log("userQuestion : ", userQuestion)
    if (language == "sinhala") {
      translatedQuestion = await translateToEnglish(userQuestion);
    } else if (language === "tamil") {
      translatedQuestion = await translateToEnglish(userQuestion);
    } else {
      translatedQuestion = userQuestion;
    }

    const lastUserIndex = chatHistory
      .map((entry: ChatEntry) => entry.role)
      .lastIndexOf("user");
    if (lastUserIndex !== -1) {
      chatHistory[lastUserIndex].content = translatedQuestion;
      // console.log(chatHistory);
    }

   await BotChats.create({
      message_id: userChatId,
      language: language,
      message: userQuestion,
      message_sent_by: "customer",
      viewed_by_admin: "no",
    });

    let kValue = 2;

    const prompt = `Compare the given user question: "${translatedQuestion}" with the question list: ${JSON.stringify(
      translatedQuestions
    )} and if the user question matches a question in the question list, then give only the id in that question list. Do not state anything else. if you cannot find a match then just say "not a product".`;

    const productOrServiceQuestion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 20,
      temperature: 0,
    });

    let botResponseIntent: string | null =
      productOrServiceQuestion.choices[0].text;

    // ==================================================
    // ==========  intent variable is stateProduct=======
    // ==================================================
    // const stateProduct = productOrServiceQuestion.choices[0].text;
    const stateProduct = botResponseIntent;
    //console.log("--------------------------------------");

    if (
      stateProduct &&
      (await stateProduct).toLowerCase().includes("not a product")
    ) {
      //console.log("It is not a product.");
      //("--------------------------------------");

      //============= change context ======================
      async function handleSearchRequest(
        translatedQuestion: string,
        kValue: number
      ) {
        // ================================================================
        // STANDALONE QUESTION GENERATE
        // ================================================================
        const filteredChatHistory = chatHistory.filter(
          (item: { role: string }) => item.role !== "system"
        );

        const chatHistoryString = JSON.stringify(filteredChatHistory);

        //console.log("chatHistory: ", chatHistoryString);

        const questionRephrasePrompt = `As a senior banking assistant, kindly assess whether the FOLLOWUP QUESTION related to the CHAT HISTORY or if it introduces a new question. If the FOLLOWUP QUESTION is unrelated, refrain from rephrasing it. However, if it is related, please rephrase it as an independent query utilizing relevent keywords from the CHAT HISTORY, even if it is a question related to the calculation. If the user asks for information like email or address, provide DFCC email and address.
----------
CHAT HISTORY: {${chatHistoryString}}
----------
FOLLOWUP QUESTION: {${translatedQuestion}}
----------
Standalone question:`;

        //console.log("questionRephrasePrompt: ", questionRephrasePrompt);

        const completionQuestion = await openai.completions.create({
          model: "gpt-3.5-turbo-instruct",
          prompt: questionRephrasePrompt,
          max_tokens: 50,
          temperature: 0,
        });

        // console.log("chatHistory : ", chatHistory);
        console.log(
          "Standalone Question PROMPT :",
          completionQuestion.choices[0].text
        );
        // category selection prompt
        // const categoryList = [
        //   "Product and Services",
        //   "Loans",
        //   "Teen Account",
        //   "Aloka Account",
        //   "Savings Account",
        //   "Personal Loans",
        //   "Pinnacle",
        //   "Cards"
        // ];

        // const categoryList = [
        //   "Cards"
        // ];

        // const typesCategory = 'Account , Loan and Services types'

        // const categorySelectionPrompt = `
        // Given a question and a list of categories, identify the category that matches the question. If the question specifically asks for types of accounts, loans, or services, categorize it as "Product and Services list". For all other questions, provide only the exact matching category name from the list. If there is no match, state "Unavailable". Do not add any additional text or punctuation.
        // ----------
        // QUESTION: {${completionQuestion.choices[0].text}}
        // ----------
        // CATEGORY LIST: {${categoryList}}
        // ----------
        // Standalone question:
        // `;

        //         const categorySelectionPrompt = `
        //   Given a question and a list of categories, identify the category that matches the question.
        //   1. If the question specifically asks for a general list or types of products, accounts, loans, or services, categorize it as "Product and Services".
        //   2. If the question specifically asks for a type of account, categorize it as "Savings Account".
        //   3. If the question specifically asks about loans, categorize it as "Loans", except if it is about personal loans, in which case categorize it as "Personal Loans".
        //   4. For all other questions, provide only the exact matching category name from the list.
        //   5. If there is no match, state "Unavailable".
        //   Do not add any additional text or punctuation.
        //   ----------
        //   QUESTION: {${completionQuestion.choices[0].text}}
        //   ----------
        //   CATEGORY LIST: {${categoryList}}
        //   ----------
        //   Category:
        // `;

        // 11111
        // const categorySelectionPrompt = `
        //   Given a question and a list of categories, identify the category that matches the question.
        //   1. If the question specifically asks for a general list of products, accounts, loans, or services, categorize it as "Product and Services".
        //   2. If the question specifically asks for a type of account, categorize it based on the exact account type mentioned (e.g., ${categoryList.join(", ")}).
        //   3. If the question specifically asks about loans, categorize it as "Loans", except if it is about personal loans, in which case categorize it as "Personal Loans".
        //   4. For all other questions, provide only the exact matching category name from the list.
        //   5. If there is no match, state "Unavailable".
        //   Do not add any additional text or punctuation.
        //   ----------
        //   QUESTION: {${completionQuestion.choices[0].text}}
        //   ----------
        //   CATEGORY LIST: {${categoryList}}
        //   ----------
        //   Category:
        // `;

        // const categorySelectionPrompt = `
        //   Given a question and a list of categories, identify the category that matches the question.
        //   1. If the question specifically asks for a general list of products, accounts, loans, or services, categorize it as "Product and Services".
        //   2. If the question specifically mentions a category name from the list (e.g., ${categoryList.join(", ")}), categorize it based on the exact name mentioned.
        //   3. If the question specifically asks about loans, categorize it as "Loans", except if it is about personal loans, in which case categorize it as "Personal Loans".
        //   4. For all other questions, provide only the exact matching category name from the list.
        //   5. If there is no match, state "Unavailable".
        //   Do not add any additional text or punctuation.
        //   ----------
        //   QUESTION: {${completionQuestion.choices[0].text}}
        //   ----------
        //   CATEGORY LIST: {${categoryList}}
        //   ----------
        //   Category:
        // `;

        // const categorySelection = await openai.completions.create({
        //   model: "gpt-3.5-turbo-instruct",
        //   prompt: categorySelectionPrompt,
        //   max_tokens: 50,
        //   temperature: 0,
        // });

        // console.log("Category :", categorySelection.choices[0].text.trim());
        // =============================================================================
        // create embeddings
        const embedding = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: completionQuestion.choices[0].text,
        });

        // =============================================================================
        // query from pinecone

        let queryResponse: {
          matches: any;
          namespace?: string;
          usage?: OperationUsage | undefined;
        };

        // if (categorySelection.choices[0].text.trim() === 'Unavailable') {

        // console.log("embedding : ", embedding.data[0].embedding)


        queryResponse = await namespace.query({
          vector: embedding.data[0].embedding,
          topK: kValue,
          includeMetadata: true,
        });
        // } else {
        //   queryResponse = await namespace.query({
        //     vector: embedding.data[0].embedding,
        //     topK: kValue,
        //     filter: {
        //       Category: { $eq: categorySelection.choices[0].text.trim() },
        //     },
        //     includeMetadata: true,
        //   });
        // }

        // =============================================================================
        // get vector documents into one string
        const results: string[] = [];
        const resultTitles: string[] = [];
        //console.log("CONTEXT : ", queryResponse.matches[0].metadata);
        queryResponse.matches.forEach(
          (match: { metadata: { Title: any; Text: any } }) => {
            if (match.metadata && typeof match.metadata.Title === "string") {
              const result = `Title: ${match.metadata.Title}, \n Content: ${match.metadata.Text} \n \n `;
              results.push(result);
            }
          }
        );
        let context = results.join("\n");
        // console.log("CONTEXT : ", context);

        queryResponse.matches.forEach((match: { metadata: { Title: any } }) => {
          if (match.metadata && typeof match.metadata.Title === "string") {
            const result = `Title: ${match.metadata.Title}, \n `;
            resultTitles.push(result);
          }
        });
        let contextTitles = resultTitles.join("\n");
        console.log("CONTEXT : ", contextTitles);

        // set system prompt
        // =============================================================================
        if (chatHistory.length === 0 || chatHistory[0].role !== "system") {
          chatHistory.unshift({ role: "system", content: "" });
        }
        // chatHistory[0].content = `You are a helpful assistant and you are friendly. if user greet you you will give proper greeting in friendly manner. Your name is DFCC GPT. Answer user question Only based on given Context: ${context}, your answer must be less than 150 words. If the user asks for information like your email or address, you'll provide DFCC email and address. If answer has list give it as numberd list. If it has math question relevent to given Context give calculated answer, If user question is not relevent to the Context just say "I'm sorry.. no information documents found for data retrieval.". Do NOT make up any answers and questions not relevant to the context using public information.`;

        // ==============================================
        // chatHistory[0].content = `You are a helpful assistant named DFCC GPT, and you are friendly. If the user greets you, respond with a warm greeting. Answer the user's questions based only on the given Context: ${context}. Keep your answers under 150 words. If the user asks for information like your email or address, provide the DFCC email and address. If the answer requires a list, present it as a numbered list. Give well structured answer without unnessasory characters other than numberd list. For math-related questions relevant to the given Context, provide the calculated answer. If the Context is not sufficient to answer the question, ask the user to be more specific with what you have. If the question is not relevant to the Context just say "I'm sorry.. no information documents found for data retrieval.". Do NOT create answers based on public information or questions unrelated to the Context.`;


        chatHistory[0].content = `You are a helpful assistant named DFCC GPT, and you are friendly. If the user greets you, respond with a warm greeting. Answer the user's questions based only on the given Context: ${context}. Keep your answers under 180 words. If the user asks for information like your email or address, provide the DFCC email and address. If the answer requires a list, present it as a numbered list, without using bold text. For math-related questions relevant to the given Context, provide the calculated answer. If the Context is not sufficient to answer the question, ask the user to be more specific. If the question is not relevant to the Context, just say "I'm sorry, no information documents found for data retrieval." Do NOT create answers based on public information or questions unrelated to the Context.`;


        // ======================================================
        //   chatHistory[0].content = `You are a helpful and friendly assistant named DFCC GPT. When the user greets you, respond with a proper, friendly greeting. Answer the user's questions based only on the given context: ${context}. Keep your answers under 150 words.

        //   Guidelines:

        //   If asked for your email or address, provide DFCC's email and address.
        //   For questions requiring a list, provide a numbered list.
        //   For math-related questions relevant to the context, give the calculated answer.
        //   If the user's question lacks details, ask for more specific information.
        //   If the question is not relevant to the context, respond with: "I'm sorry.. no information documents found for data retrieval."
        //   Do not make up answers or use public information for questions not relevant to the context.`;
      }

      // async function processRequest(translatedQuestion: string, userChatId: string) {
      await handleSearchRequest(translatedQuestion, kValue);

      // console.log("chatHistory",chatHistory);
      // GPT response ===========================
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", //gpt-3.5-turbo gpt-4o-mini
        messages: chatHistory,
        max_tokens: 200,
        temperature: 0,
      });

      let botResponse: string | null = completion.choices[0].message.content;
      let selectedLanguage = "en";
      let translatedResponse = "";
      // console.log("botResponse : ", botResponse)
      if (language == "sinhala") {
        selectedLanguage = "si";
        if (botResponse !== null) {
          translatedResponse = await translateToLanguage(botResponse);
        }
      } else if (language === "tamil") {
        selectedLanguage = "ta";
        if (botResponse !== null) {
          translatedResponse = await translateToLanguage(botResponse);
        }
      } else {
        selectedLanguage = "en";
        if (botResponse !== null) {
          translatedResponse = botResponse;
        }
      }
      async function translateToLanguage(botResponse: string) {
        const [translationsToLanguage] = await translate.translate(
          botResponse,
          selectedLanguage
        );
        const finalAnswer = Array.isArray(translationsToLanguage)
          ? translationsToLanguage.join(", ")
          : translationsToLanguage;
        return finalAnswer;
      }

      //console.log("GPT response : ", translatedResponse);

      // add assistant to array
      chatHistory.push({ role: "assistant", content: botResponse });

      // console.log(" send chat id : ", userChatId)
      // }
      // await processRequest(translatedQuestion, userChatId);

      await BotChats.create({
      message_id: userChatId,
      language: language,
      message: translatedResponse,
      message_sent_by: "bot",
      viewed_by_admin: "no",
    });
      console.log("botResponse ---- > ", botResponse);
      // console.log("translatedResponse",translatedResponse);
      res.json({
        answer: translatedResponse,
        chatHistory: chatHistory,
        chatId: userChatId,
        productOrService: null,
      });
      // }

      // run gpt bot
    } else {
      //console.log("It is a product. go to flow builder function");
      //console.log("--------------------------------------");

      try {
        // const intentToSend = stateProduct.toLocaleLowerCase()
        const intentToSend = stateProduct.trim().toLowerCase();
        // const intentToSend =  stateProduct
        console.log("intentToSend (processed): ", intentToSend);

        //console.log("intentToSend (processed): ", intentToSend);

        const response = await fetch(
          "https://dfcc.vercel.app/chat-bot-get-intent-data",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ intent: intentToSend }),
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok.");
        }

        const responseData = await response.json();
        const intentData = (responseData as ResponseData).intentData;
        //console.log("gpt intentData: ", intentData);

        res.json({
          answer: null,
          chatHistory: chatHistory,
          chatId: userChatId,
          productOrService: intentData.length > 0 ? intentData : null,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle the error appropriately
      }
    }
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};

// Call the async function

// const questionRephrasePrompt = `Follow these steps to answer the user queries.

// Step 1: First find out followup question is referring to based on what conversation topic.

// step 2: rephrase the follow up question to be a standalone question with the conversation topic.

// ----------
// CHAT HISTORY: {${chatHistoryString}}
// ----------
// FOLLOWUP QUESTION: {${translatedQuestion}}
// ----------
// Standalone question:`

// const fileIds  = await File.findAll({
//     attributes: ['file_id']
//   });

//   const ids = fileIds.map(file => file.file_id);
// const fetchResult = await index.namespace('dfcc-bot-knowledge').fetch(ids);
// const documents = Object.values(fetchResult.records).map(record => {
//     if (record.metadata) {
//         return record.metadata.Title;
//     }
//     return null;
// }).filter(title => title !== null);

// console.log(documents);

// =======================================================================
//             const questionRephrasePrompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
// ----------
// CHAT HISTORY: {${chatHistoryString}}
// ----------
// FOLLOWUP QUESTION: {${translatedQuestion}}
// ----------
// Standalone question:`
// =======================================================================

// const questionRephrasePrompt = `Given the following conversation and a follow up question, rephrase the follow up question with a insight regarding the topic discussed to be a standalone question.
// ----------
// CHAT HISTORY: {${chatHistoryString}}
// ----------
// FOLLOWUP QUESTION: {${translatedQuestion}}
// ----------
// Standalone question:`

// Give insight regarding the topic discussed.
// const questionRephrasePrompt = `Given the following conversation and a follow up question, Give insight regarding the topic discussed.
// ----------
// CHAT HISTORY: {${chatHistoryString}}
// ----------
// FOLLOWUP QUESTION: {${translatedQuestion}}
// ----------
// TOPIC:`

// get streaming data into a variable
// let contentArray = [];
// for await (const chunk of completion) {
//   contentArray.push(chunk.choices[0].delta.content);
// }
// const chatTextHistory = contentArray.join('');

// const randomString = Math.random().toString(36).substring(2, 15);
// const prefix = 'chat';
// userChatId = `${prefix}_${randomString}`;
// console.log("Generated chat id : ", userChatId);
