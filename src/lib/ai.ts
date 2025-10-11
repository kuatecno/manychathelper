import OpenAI from 'openai';

export interface AIConfig {
  aiProvider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  apiKey: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  conversationMemory?: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  tokens?: number;
  model: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    switch (this.config.aiProvider) {
      case 'openai':
        return this.chatOpenAI(messages);
      case 'anthropic':
        throw new Error('Anthropic provider not yet implemented');
      case 'gemini':
        throw new Error('Gemini provider not yet implemented');
      default:
        throw new Error(`Unsupported AI provider: ${this.config.aiProvider}`);
    }
  }

  private async chatOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    const openai = new OpenAI({
      apiKey: this.config.apiKey,
    });

    // Prepend system message if provided
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (this.config.systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: this.config.systemPrompt,
      });
    }

    // Add conversation messages
    formattedMessages.push(
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    const completion = await openai.chat.completions.create({
      model: this.config.model || 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 500,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      tokens: completion.usage?.total_tokens,
      model: completion.model,
    };
  }
}

// Helper to validate AI config
export function validateAIConfig(config: any): config is AIConfig {
  return (
    config &&
    typeof config.aiProvider === 'string' &&
    typeof config.model === 'string' &&
    typeof config.apiKey === 'string' &&
    ['openai', 'anthropic', 'gemini'].includes(config.aiProvider)
  );
}
