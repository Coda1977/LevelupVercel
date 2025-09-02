import Anthropic from '@anthropic-ai/sdk';

/*
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514" as it is the latest model.
*/

const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function getChatResponse(
  messages: Array<{role: string, content: string}>,
  systemPrompt?: string
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 1024,
      system: systemPrompt || `You are an AI mentor for Level Up, a management development platform. 
        You help managers apply management concepts to real workplace situations. 
        Be practical, supportive, and reference specific Level Up content when relevant.
        Keep responses conversational and actionable.`,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Failed to get AI response');
  }
}
