// Advanced Claude API orchestration with robust error handling and retries
import Anthropic from '@anthropic-ai/sdk';
import type {
  SummaryRequest,
  SummaryResponse,
  PersonaType,
  TemplateOptions
} from './types';
import type { ResourceSelectionResult } from '@plumly/fhir-utils';
import { PromptTemplateManager } from './prompt-templates';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerHour: number;
  tokensPerHour: number;
  resetTime?: Date;
}

export class ClaudeClient {
  private anthropic: Anthropic;
  private templateManager: PromptTemplateManager;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };
  private rateLimitInfo: RateLimitInfo | null = null;
  private lastRequestTime = 0;
  private requestCount = 0;

  constructor(apiKey: string, options: { retryConfig?: Partial<RetryConfig> } = {}) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.anthropic = new Anthropic({
      apiKey,
      timeout: 30000 // 30 second timeout
    });

    this.templateManager = new PromptTemplateManager();

    if (options.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...options.retryConfig };
    }
  }

  async summarize(
    request: SummaryRequest
  ): Promise<SummaryResponse> {
    const startTime = Date.now();
    this.validateSummaryRequest(request);

    try {
      const prompt = this.buildPrompt(request);
      const claudeResponse = await this.makeRequestWithRetry(prompt, request);
      const parsedResponse = this.parseStructuredResponse(claudeResponse);
      const validatedResponse = this.validateResponse(parsedResponse, request);

      return {
        ...validatedResponse,
        metadata: {
          ...validatedResponse.metadata,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          templateId: this.templateManager.getTemplate(request.persona)?.id || 'unknown',
          templateVersion: this.templateManager.getTemplate(request.persona)?.version || '1.0.0'
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      throw this.enhanceError(error, processingTime, request);
    }
  }

  private validateSummaryRequest(request: SummaryRequest): void {
    if (!request.resourceData) {
      throw new Error('ResourceData is required');
    }

    if (!request.persona || !['patient', 'provider', 'caregiver', 'patient-es'].includes(request.persona)) {
      throw new Error('Valid persona is required');
    }

    if (!request.resourceData.patient) {
      throw new Error('Patient data is required in resourceData');
    }
  }

  private buildPrompt(request: SummaryRequest): string {
    try {
      return this.templateManager.buildPrompt(
        request.resourceData,
        request.persona,
        request.templateOptions || {},
        request.abTestVariant
      );
    } catch (error) {
      throw new Error(`Failed to build prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequestWithRetry(
    prompt: string,
    request: SummaryRequest,
    attemptNumber: number = 1
  ): Promise<string> {
    // Rate limiting check
    await this.enforceRateLimit();

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.calculateMaxTokens(request),
        temperature: 0.3, // Consistent, factual output
        system: this.buildSystemPrompt(request.persona),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      this.updateRateLimitInfo(response);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      return content.text;
    } catch (error) {
      return this.handleRequestError(error, prompt, request, attemptNumber);
    }
  }

  private async handleRequestError(
    error: any,
    prompt: string,
    request: SummaryRequest,
    attemptNumber: number
  ): Promise<string> {
    const errorInfo = this.analyzeError(error);

    // Don't retry on validation errors or non-retryable errors
    if (!errorInfo.retryable || attemptNumber >= this.retryConfig.maxRetries) {
      throw error;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1),
      this.retryConfig.maxDelay
    );

    console.warn(`Claude API request failed (attempt ${attemptNumber}/${this.retryConfig.maxRetries}), retrying in ${delay}ms:`, errorInfo.message);

    await this.sleep(delay);
    return this.makeRequestWithRetry(prompt, request, attemptNumber + 1);
  }

  private analyzeError(error: any): { retryable: boolean; message: string; type: string } {
    if (error?.error?.type) {
      switch (error.error.type) {
        case 'rate_limit_error':
          return { retryable: true, message: 'Rate limit exceeded', type: 'rate_limit' };
        case 'overloaded_error':
          return { retryable: true, message: 'Claude API overloaded', type: 'capacity' };
        case 'api_error':
          return { retryable: true, message: 'Internal API error', type: 'api_error' };
        case 'authentication_error':
          return { retryable: false, message: 'Invalid API key', type: 'auth' };
        case 'invalid_request_error':
          return { retryable: false, message: 'Invalid request format', type: 'invalid_request' };
        default:
          return { retryable: true, message: error.error.message || 'Unknown API error', type: 'unknown' };
      }
    }

    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return { retryable: true, message: 'Network connection error', type: 'network' };
    }

    return { retryable: false, message: error?.message || 'Unknown error', type: 'unknown' };
  }

  private calculateMaxTokens(request: SummaryRequest): number {
    // Adjust token count based on persona and data complexity
    const baseTokens = 1500;
    const dataComplexity = (
      (request.resourceData.conditions?.length || 0) +
      (request.resourceData.medications?.length || 0) +
      (request.resourceData.labValues?.length || 0)
    );

    let tokens = baseTokens + (dataComplexity * 50);

    // Persona-specific adjustments
    switch (request.persona) {
      case 'patient':
        tokens *= 0.8; // Simpler language, fewer tokens needed
        break;
      case 'provider':
        tokens *= 1.2; // More detailed clinical analysis
        break;
      case 'caregiver':
        tokens *= 1.0; // Balanced approach
        break;
      case 'patient-es':
        tokens *= 0.8; // Same as patient — concise bilingual output
        break;
    }

    return Math.min(Math.max(tokens, 1000), 4000); // Between 1K and 4K tokens
  }

  private buildSystemPrompt(persona: PersonaType): string {
    const basePrompt = `You are an AI assistant specialized in summarizing clinical health data. You must return your response in valid JSON format following the exact schema provided.`;

    const personaInstructions: Record<string, string> = {
      patient: 'Use simple, clear language that patients and families can understand. Avoid medical jargon.',
      provider: 'Use precise medical terminology appropriate for healthcare professionals. Focus on clinical decision-making.',
      caregiver: 'Provide practical, actionable information for caregivers. Include specific care instructions.',
      'patient-es': 'Responde COMPLETAMENTE EN ESPAÑOL usando el registro de "Usted". Usa lenguaje sencillo a nivel de 6° grado de primaria. Evita términos médicos sin explicarlos. Sé claro, directo y tranquilizador.',
    };

    return `${basePrompt}\n\n${personaInstructions[persona] ?? personaInstructions['patient']}\n\nIMPORTANT: Your response must be valid JSON matching this schema:
{
  "summary": "string - main narrative summary",
  "sections": [
    {
      "id": "string - section identifier",
      "title": "string - section title",
      "content": "string - section content",
      "confidence": "number - confidence 0-1",
      "sources": ["string - source references"]
    }
  ],
  "metadata": {
    "persona": "${persona}",
    "sectionsGenerated": ["string - section IDs"]
  }
}`;
  }

  private parseStructuredResponse(response: string): any {
    try {
      // Try to extract JSON from response if it's wrapped in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;

      return JSON.parse(jsonString);
    } catch (error) {
      // Fallback: create structured response from unstructured text
      return this.createFallbackStructuredResponse(response);
    }
  }

  private createFallbackStructuredResponse(response: string): any {
    // Simple fallback when JSON parsing fails
    const sections = response.split('\n\n').filter(section => section.trim().length > 0);
    const timestamp = new Date().toISOString();

    return {
      summary: response.length > 500 ? response.substring(0, 497) + '...' : response,
      sections: sections.map((content, index) => ({
        id: `section-${index + 1}`,
        title: `Section ${index + 1}`,
        content: content.trim(),
        confidence: 0.7,
        sources: [],
        claims: [],
        metadata: {
          generatedAt: timestamp,
          persona: 'patient',
          template: 'fallback',
          processingTime: 0
        }
      })),
      metadata: {
        persona: 'patient',
        sectionsGenerated: sections.map((_, index) => `section-${index + 1}`),
        fallback: true
      }
    };
  }

  private validateResponse(response: any, request: SummaryRequest): SummaryResponse {
    const errors: string[] = [];

    // Validate required fields
    if (!response.summary || typeof response.summary !== 'string') {
      errors.push('Missing or invalid summary field');
    }

    if (!Array.isArray(response.sections)) {
      errors.push('Missing or invalid sections array');
    } else {
      response.sections.forEach((section: any, index: number) => {
        if (!section.id || !section.title || !section.content) {
          errors.push(`Section ${index + 1} missing required fields`);
        }
        if (typeof section.confidence !== 'number' || section.confidence < 0 || section.confidence > 1) {
          section.confidence = 0.8; // Default confidence
        }
        if (!Array.isArray(section.sources)) {
          section.sources = [];
        }
        if (!Array.isArray(section.claims)) {
          section.claims = [];
        }
        // Ensure section has metadata
        if (!section.metadata) {
          section.metadata = {};
        }
        // Add required metadata fields
        section.metadata = {
          generatedAt: new Date().toISOString(),
          persona: request.persona,
          template: this.templateManager.getTemplate(request.persona)?.id || 'unknown',
          processingTime: 0, // Will be updated at response level
          ...section.metadata
        };
      });
    }

    if (!response.metadata) {
      response.metadata = {};
    }

    if (errors.length > 0) {
      throw new Error(`Invalid response structure: ${errors.join(', ')}`);
    }

    // Ensure metadata completeness
    response.metadata = {
      persona: request.persona,
      sectionsGenerated: response.sections.map((s: any) => s.id),
      ...response.metadata
    };

    return response as SummaryResponse;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Minimum delay between requests (avoid hammering the API)
    const minDelay = 100; // 100ms
    if (timeSinceLastRequest < minDelay) {
      await this.sleep(minDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private updateRateLimitInfo(response: any): void {
    // Extract rate limit info from response headers if available
    // This is a placeholder - actual implementation would depend on API headers
    const headers = response?.headers || {};

    if (headers['anthropic-ratelimit-requests-remaining']) {
      this.rateLimitInfo = {
        requestsPerMinute: parseInt(headers['anthropic-ratelimit-requests-limit'] || '0'),
        tokensPerMinute: parseInt(headers['anthropic-ratelimit-tokens-limit'] || '0'),
        requestsPerHour: 0,
        tokensPerHour: 0
      };
    }
  }

  private enhanceError(error: any, processingTime: number, request: SummaryRequest): Error {
    const errorInfo = this.analyzeError(error);

    const enhancedError = new Error(errorInfo.message);
    (enhancedError as any).type = errorInfo.type;
    (enhancedError as any).retryable = errorInfo.retryable;
    (enhancedError as any).processingTime = processingTime;
    (enhancedError as any).persona = request.persona;
    (enhancedError as any).originalError = error;

    return enhancedError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to get current rate limit status
  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  // Public method to get retry configuration
  public getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Summarize from pre-flattened clinical text (for very large bundles)
   * This bypasses normal FHIR processing and generates summary directly from text
   */
  async summarizeFromText(
    clinicalText: string,
    options: {
      persona?: PersonaType;
      focusAreas?: string[];
    } = {}
  ): Promise<SummaryResponse> {
    const startTime = Date.now();
    const persona = options.persona || 'patient';

    try {
      const prompt = this.buildTextSummaryPrompt(clinicalText, persona, options.focusAreas);

      // Rate limiting check
      await this.enforceRateLimit();

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        temperature: 0.3,
        system: this.buildSystemPrompt(persona),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      this.updateRateLimitInfo(response);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      const parsedResponse = this.parseStructuredResponse(content.text);

      // Ensure metadata completeness
      if (!parsedResponse.metadata) {
        parsedResponse.metadata = {};
      }
      parsedResponse.metadata = {
        persona,
        sectionsGenerated: parsedResponse.sections?.map((s: any) => s.id) || [],
        inputMode: 'clinical-text-summary',
        ...parsedResponse.metadata
      };

      // Validate sections
      if (Array.isArray(parsedResponse.sections)) {
        parsedResponse.sections = parsedResponse.sections.map((section: any, index: number) => ({
          id: section.id || `section-${index + 1}`,
          title: section.title || `Section ${index + 1}`,
          content: section.content || '',
          confidence: typeof section.confidence === 'number' ? section.confidence : 0.8,
          sources: section.sources || [],
          claims: section.claims || [],
          metadata: {
            generatedAt: new Date().toISOString(),
            persona,
            template: 'text-summary',
            processingTime: Date.now() - startTime,
            ...section.metadata
          }
        }));
      }

      return {
        summary: parsedResponse.summary || '',
        sections: parsedResponse.sections || [],
        metadata: {
          ...parsedResponse.metadata,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          templateId: 'text-summary',
          templateVersion: '1.0.0'
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorInfo = this.analyzeError(error);

      const enhancedError = new Error(errorInfo.message);
      (enhancedError as any).type = errorInfo.type;
      (enhancedError as any).retryable = errorInfo.retryable;
      (enhancedError as any).processingTime = processingTime;
      (enhancedError as any).persona = persona;
      (enhancedError as any).originalError = error;

      throw enhancedError;
    }
  }

  private buildTextSummaryPrompt(
    clinicalText: string,
    persona: PersonaType,
    focusAreas?: string[]
  ): string {
    let prompt = `Please analyze the following clinical summary and provide a comprehensive health summary:\n\n${clinicalText}\n\n`;

    if (focusAreas && focusAreas.length > 0) {
      prompt += `Focus particularly on: ${focusAreas.join(', ')}\n\n`;
    }

    prompt += `Generate a summary appropriate for a ${persona === 'provider' ? 'healthcare provider' : persona === 'caregiver' ? 'caregiver' : 'patient'}.`;

    return prompt;
  }

  // Public method to test API connectivity
  public async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}