export type BriefStatus = 'pending' | 'generating' | 'sent' | 'viewed' | 'error';
export type ReferralStatus = 'pending' | 'scheduled' | 'completed' | 'unknown';
export type PreferredLanguage = 'en' | 'es';

export interface WorkQueueItem {
  id: string;
  patientId: string;
  name: string;
  dob?: string;
  preferredLanguage: PreferredLanguage;
  briefStatus: BriefStatus;
  lastContact?: string;
  phone?: string;
  upcomingAppointment?: string;
}

export interface OutreachTask {
  id: string;
  patientId: string;
  patientName: string;
  phone?: string;
  preferredLanguage: PreferredLanguage;
  briefUrl?: string;
  script: string;
}

export interface ReferralStub {
  id: string;
  patientId: string;
  specialist: string;
  specialty: string;
  status: ReferralStatus;
  referredDate: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
}
