import { MPOSConfig } from '../domain/types';

export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  sectionHeading?: string;
  documentType?: string;
}

export interface AICompletionResponse {
  text: string;
  model: string;
  provider: string;
}

export interface AIModelsResponse {
  models: string[];
  provider: string;
}

const SYSTEM_PROMPT_BASE = `You are a technical documentation assistant for a software project.
You write clear, concise Markdown content for project documents.
Follow these rules:
- Use Markdown formatting (headings, lists, bold, code blocks)
- Be specific and actionable
- Match the document type (epic, story, task, decision, etc.)
- Keep content professional and well-structured
- Do not include the section heading in your response
- Do not use frontmatter or YAML
- Return only the content for the section`;

function buildProviderUrl(config: MPOSConfig, endpoint: string): string {
  const base = config.ai.baseUrl.replace(/\/+$/, '');
  switch (config.ai.provider) {
    case 'ollama':
      return `${base}/api/${endpoint}`;
    case 'lmstudio':
      return `${base}/v1/${endpoint}`;
    case 'openai-compatible':
      return `${base}/v1/${endpoint}`;
    default:
      return `${base}/api/${endpoint}`;
  }
}

export async function listModels(config: MPOSConfig): Promise<AIModelsResponse> {
  if (config.ai.provider === 'ollama') {
    const url = buildProviderUrl(config, 'tags');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to connect to Ollama: ${res.status}`);
    const data = await res.json() as { models?: Array<{ name: string }> };
    return {
      models: (data.models || []).map((m) => m.name),
      provider: 'ollama',
    };
  }

  // LM Studio / OpenAI-compatible
  const url = buildProviderUrl(config, 'models');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to connect to ${config.ai.provider}: ${res.status}`);
  const data = await res.json() as { data?: Array<{ id: string }> };
  return {
    models: (data.data || []).map((m) => m.id),
    provider: config.ai.provider,
  };
}

export async function complete(config: MPOSConfig, request: AICompletionRequest): Promise<AICompletionResponse> {
  const systemPrompt = request.systemPrompt || SYSTEM_PROMPT_BASE;

  if (config.ai.provider === 'ollama') {
    const url = buildProviderUrl(config, 'generate');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ai.model,
        prompt: request.prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: config.ai.temperature,
          num_predict: config.ai.maxTokens,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama request failed (${res.status}): ${errText}`);
    }

    const data = await res.json() as { response?: string };
    return {
      text: (data.response || '').trim(),
      model: config.ai.model,
      provider: 'ollama',
    };
  }

  // LM Studio / OpenAI-compatible chat completions
  const url = buildProviderUrl(config, 'chat/completions');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.prompt },
      ],
      temperature: config.ai.temperature,
      max_tokens: config.ai.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error');
    throw new Error(`${config.ai.provider} request failed (${res.status}): ${errText}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return {
    text: (data.choices?.[0]?.message?.content || '').trim(),
    model: config.ai.model,
    provider: config.ai.provider,
  };
}
