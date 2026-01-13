// ORIGINAL: Vercel AI Gateway - COMMENTED OUT (using Azure OpenAI instead)
// import { gateway } from "@ai-sdk/gateway";
import { createAzure } from "@ai-sdk/azure";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// NEW: Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_ENDPOINT?.split("https://")[1]?.split(".openai.azure.com")[0] || "",
  apiKey: process.env.AZURE_OPENAI_API_KEY || "",
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // ORIGINAL: Vercel AI Gateway models - COMMENTED OUT
        // "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
        // "chat-model-reasoning": wrapLanguageModel({
        //   model: gateway.languageModel("xai/grok-3-mini"),
        //   middleware: extractReasoningMiddleware({ tagName: "think" }),
        // }),
        // "title-model": gateway.languageModel("xai/grok-2-1212"),
        // "artifact-model": gateway.languageModel("xai/grok-2-1212"),
        
        // NEW: Azure OpenAI models (using GPT-4o)
        "chat-model": azure(process.env.AZURE_OPENAI_LLM_DEP_NAME || "gpt-4o"),
        "chat-model-reasoning": azure(process.env.AZURE_OPENAI_LLM_DEP_NAME || "gpt-4o"),
        "title-model": azure(process.env.AZURE_OPENAI_LLM_DEP_NAME || "gpt-4o"),
        "artifact-model": azure(process.env.AZURE_OPENAI_LLM_DEP_NAME || "gpt-4o"),
      },
    });
