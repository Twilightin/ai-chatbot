export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    // ORIGINAL: Grok Vision model - COMMENTED OUT (using Azure OpenAI GPT-4o)
    // name: "Grok Vision",
    // description: "Advanced multimodal model with vision and text capabilities",
    
    // NEW: Azure OpenAI GPT-4o
    name: "GPT-4o",
    description: "Azure OpenAI GPT-4o - Advanced language model with multimodal capabilities",
  },
  {
    id: "chat-model-reasoning",
    // ORIGINAL: Grok Reasoning model - COMMENTED OUT (using Azure OpenAI GPT-4o)
    // name: "Grok Reasoning",
    // description: "Uses advanced chain-of-thought reasoning for complex problems",
    
    // NEW: Azure OpenAI GPT-4o (Reasoning)
    name: "GPT-4o (Reasoning)",
    description: "Azure OpenAI GPT-4o with enhanced reasoning for complex problems",
  },
];
