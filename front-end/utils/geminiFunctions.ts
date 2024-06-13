import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleAIFileManager } from "@google/generative-ai/files"

require('dotenv').config({ path: '../' })

const KEY: string = process.env.GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(KEY);
const fileManager = new GoogleAIFileManager(KEY);


