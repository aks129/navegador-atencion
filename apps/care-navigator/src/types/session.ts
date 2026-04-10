import type { LaunchContext } from '@plumly/smart-fhir';

export interface SessionData {
  /** Set during SMART launch initiation, verified in callback */
  pkce?: {
    codeVerifier: string;
    state: string;
  };
  /** SMART token + patient context, set after successful callback */
  launchContext?: LaunchContext;
  /** Set to true after patient reviews and accepts consent */
  consentGiven?: boolean;
  /** Set to true if patient has opted out of summaries */
  optedOut?: boolean;
  /** Navigator demo session identifier */
  navigatorId?: string;
  /** User's chosen locale — preserved through OAuth redirect */
  locale?: 'en' | 'es';
}
