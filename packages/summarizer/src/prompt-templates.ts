// Advanced prompt template management with persona-specific sections
import type {
  PersonaTemplate,
  PersonaType,
  TemplateOptions,
  SectionManifest,
  TemplateValidationResult
} from './types';
import type { ResourceSelectionResult } from '@plumly/fhir-utils';
import {
  TEMPLATE_REGISTRY,
  AB_TEST_VARIANTS,
  SECTION_MANIFESTS
} from './persona-templates';

export class PromptTemplateManager {
  private templates: Map<string, PersonaTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    Object.values(TEMPLATE_REGISTRY).forEach(template => {
      // Store by both ID and persona for flexible lookup
      this.templates.set(template.id, template);
      this.templates.set(template.persona, template);
    });

    // Load A/B test variants
    Object.values(AB_TEST_VARIANTS).forEach(variants => {
      Object.values(variants).forEach(variant => {
        this.templates.set(variant.id, variant);
      });
    });
  }

  public getTemplate(
    persona: PersonaType,
    abTestVariant?: string
  ): PersonaTemplate | null {
    if (abTestVariant) {
      const variantId = `${persona}-${abTestVariant}`;
      const template = this.templates.get(variantId);
      if (template) return template;
    }

    return this.templates.get(persona) || null;
  }

  public buildPrompt(
    resourceData: ResourceSelectionResult,
    persona: PersonaType,
    options: TemplateOptions = {},
    abTestVariant?: string
  ): string {
    const template = this.getTemplate(persona, abTestVariant);
    if (!template) {
      throw new Error(`Template not found for persona: ${persona}`);
    }

    const enabledSections = this.determineEnabledSections(
      template,
      resourceData,
      options
    );

    const sectionPrompts = this.buildSectionPrompts(
      enabledSections,
      resourceData,
      template,
      options
    );

    return template.promptTemplate.replace('{{SECTIONS}}', sectionPrompts);
  }

  private determineEnabledSections(
    template: PersonaTemplate,
    resourceData: ResourceSelectionResult,
    options: TemplateOptions
  ): SectionManifest[] {
    const availableSections = template.sections.filter(section => {
      // Check if section is explicitly disabled
      if (options.enabledSections?.[section.id] === false) {
        return false;
      }

      // Check if section is explicitly enabled
      if (options.enabledSections?.[section.id] === true) {
        return true;
      }

      // Check exclude list
      if (options.excludeSections?.includes(section.id)) {
        return false;
      }

      // Check include list (if provided, only include listed sections)
      if (options.includeSections && !options.includeSections.includes(section.id)) {
        return false;
      }

      // Check section conditions
      if (section.conditions) {
        if (section.conditions.hasLabValues && resourceData.labValues.length === 0) {
          return false;
        }
        if (section.conditions.hasChronicConditions &&
            resourceData.conditions.filter(c => c.isChronic).length === 0) {
          return false;
        }
        if (section.conditions.hasActiveMedications &&
            resourceData.medications.filter(m => m.isActive).length === 0) {
          return false;
        }
        if (section.conditions.hasAbnormalValues &&
            resourceData.labValues.filter(l => l.isAbnormal).length === 0) {
          return false;
        }
      }

      return section.enabledByDefault;
    });

    // Sort by priority (highest first)
    return availableSections.sort((a, b) => b.priority - a.priority);
  }

  private buildSectionPrompts(
    sections: SectionManifest[],
    resourceData: ResourceSelectionResult,
    template: PersonaTemplate,
    options: TemplateOptions
  ): string {
    const sectionPrompts: string[] = [];

    sections.forEach(section => {
      const sectionPrompt = this.buildSectionPrompt(
        section,
        resourceData,
        template,
        options
      );
      if (sectionPrompt) {
        sectionPrompts.push(sectionPrompt);
      }
    });

    return sectionPrompts.join('\n\n');
  }

  private buildSectionPrompt(
    section: SectionManifest,
    resourceData: ResourceSelectionResult,
    template: PersonaTemplate,
    options: TemplateOptions
  ): string {
    const relevantData = this.extractRelevantData(section, resourceData);
    if (!relevantData) return '';

    let prompt = `**${section.title}**\n`;
    prompt += `Generate content for this section based on: ${relevantData}\n`;
    prompt += `Style: ${template.styleGuidelines.tone}\n`;
    prompt += `Technical level: ${template.styleGuidelines.technicalLevel}\n`;

    if (options.focusAreas && options.focusAreas.length > 0) {
      prompt += `Focus areas: ${options.focusAreas.join(', ')}\n`;
    }

    if (options.customInstructions) {
      prompt += `Additional instructions: ${options.customInstructions}\n`;
    }

    return prompt;
  }

  private extractRelevantData(
    section: SectionManifest,
    resourceData: ResourceSelectionResult
  ): string | null {
    const dataElements: string[] = [];

    // Map section IDs to relevant data
    switch (section.id) {
      case 'patient-overview':
      case 'clinical-overview':
      case 'care-overview':
        dataElements.push(
          `Patient: ${resourceData.patient?.name?.[0]?.given?.join(' ') ?? ''} ${resourceData.patient?.name?.[0]?.family ?? 'Unknown'}`.trim(),
          `${resourceData.conditions.length} conditions`,
          `${resourceData.medications.filter(m => m.isActive).length} active medications`,
          `${resourceData.labValues.length} recent lab values`
        );
        break;

      case 'active-conditions':
      case 'clinical-conditions':
      case 'care-conditions':
        if (resourceData.conditions.length > 0) {
          dataElements.push(
            ...resourceData.conditions.map(c =>
              `${c.name} (${c.clinicalStatus}${c.isChronic ? ', chronic' : ''})`
            )
          );
        }
        break;

      case 'current-medications':
      case 'medication-review':
      case 'medication-management':
        const activeMeds = resourceData.medications.filter(m => m.isActive);
        if (activeMeds.length > 0) {
          dataElements.push(
            ...activeMeds.map(m =>
              `${m.name} (${m.status}${m.dosage ? `, ${m.dosage}` : ''})`
            )
          );
        }
        break;

      case 'important-results':
      case 'lab-analysis':
      case 'monitoring-values':
        if (resourceData.labValues.length > 0) {
          dataElements.push(
            ...resourceData.labValues.map(l =>
              `${l.display}: ${l.value} ${l.unit}${l.isAbnormal ? ' (abnormal)' : ''}${l.date ? ` (${l.date})` : ''}`
            )
          );
        }
        break;

      case 'important-alerts':
      case 'clinical-alerts':
      case 'care-alerts':
        const abnormalLabs = resourceData.labValues.filter(l => l.isAbnormal);
        if (abnormalLabs.length > 0) {
          dataElements.push(
            ...abnormalLabs.map(l =>
              `Abnormal ${l.display}: ${l.value} ${l.unit}`
            )
          );
        }
        break;

      default:
        // Generic section - include summary data
        dataElements.push(
          `Summary data: ${resourceData.conditions.length} conditions, ${resourceData.medications.length} medications, ${resourceData.labValues.length} lab values`
        );
    }

    return dataElements.length > 0 ? dataElements.join('; ') : null;
  }

  public validateTemplate(template: PersonaTemplate): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!template.id || !template.name || !template.persona) {
      errors.push('Template missing required fields: id, name, or persona');
    }

    if (!template.promptTemplate || !template.promptTemplate.includes('{{SECTIONS}}')) {
      errors.push('Template must include {{SECTIONS}} placeholder in promptTemplate');
    }

    if (!template.sections || template.sections.length === 0) {
      errors.push('Template must define at least one section');
    }

    // Required section validation
    const hasRequiredSection = template.sections?.some(s => s.required);
    if (!hasRequiredSection) {
      warnings.push('Template should have at least one required section');
    }

    // Reading level validation for patient templates
    if (template.persona === 'patient') {
      const readingLevelCheck = this.validateReadingLevel(template);
      if (readingLevelCheck && !readingLevelCheck.meetsTarget) {
        warnings.push(`Reading level may be too high: ${readingLevelCheck.estimated}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateReadingLevel(template: PersonaTemplate) {
    // Simple reading level analysis based on template content
    const text = template.promptTemplate;
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    let estimated = 'Unknown';
    let meetsTarget = true;

    if (avgWordsPerSentence > 20) {
      estimated = 'Graduate';
      meetsTarget = false;
    } else if (avgWordsPerSentence > 15) {
      estimated = '12th grade';
      meetsTarget = template.targetAudience.readingLevel !== '8th grade';
    } else if (avgWordsPerSentence > 12) {
      estimated = '10th grade';
      meetsTarget = template.targetAudience.readingLevel !== '8th grade';
    } else {
      estimated = '8th grade';
      meetsTarget = true;
    }

    return {
      estimated,
      meetsTarget,
      suggestions: meetsTarget ? [] : [
        'Use shorter sentences',
        'Replace complex words with simpler alternatives',
        'Break up long explanations'
      ]
    };
  }

  public getAvailableTemplates(): PersonaTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByPersona(persona: PersonaType): PersonaTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.persona === persona);
  }
}