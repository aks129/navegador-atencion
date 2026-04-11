'use client';

import { create } from 'zustand';
import type { WorkQueueItem, BriefStatus } from '@/types/navigator';
import type { BilingualBrief } from '@/types/brief';

interface CareNavigatorState {
  // Patient work queue
  patients: WorkQueueItem[];
  setPatients: (patients: WorkQueueItem[]) => void;
  updateBriefStatus: (patientId: string, status: BriefStatus) => void;

  // Cached briefs
  briefs: Record<string, BilingualBrief>;
  setBrief: (patientId: string, brief: BilingualBrief) => void;

  // UI state
  selectedPatientId: string | null;
  selectPatient: (id: string | null) => void;

  // Active locale for client components (mirrors URL)
  locale: 'en' | 'es';
  setLocale: (locale: 'en' | 'es') => void;
}

// Demo patients for navigator console — Medi-Cal realistic demographics
const DEMO_PATIENTS: WorkQueueItem[] = [
  {
    id: '1',
    patientId: 'patient-001',
    name: 'María García',
    dob: '1968-03-15',
    preferredLanguage: 'es',
    briefStatus: 'pending',
    lastContact: '2025-12-01',
    lastOutreach: '2026-02-14',
    phone: '+15105550001',
    upcomingAppointment: '2026-04-15',
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    careGaps: ['HbA1c overdue', 'BP uncontrolled'],
  },
  {
    id: '2',
    patientId: 'patient-002',
    name: 'José Hernández',
    dob: '1952-07-22',
    preferredLanguage: 'es',
    briefStatus: 'sent',
    lastContact: '2026-04-08',
    lastOutreach: '2026-03-20',
    phone: '+15105550002',
    upcomingAppointment: '2026-04-14',
    conditions: ['Type 2 Diabetes', 'CKD Stage 3'],
    careGaps: ['HbA1c overdue', 'Nephrology follow-up due'],
  },
  {
    id: '3',
    patientId: 'patient-003',
    name: 'Ana Martínez',
    dob: '1975-11-30',
    preferredLanguage: 'es',
    briefStatus: 'viewed',
    lastContact: '2026-04-07',
    lastOutreach: '2026-03-28',
    phone: '+15105550003',
    upcomingAppointment: '2026-04-16',
    conditions: ['Hypertension'],
    careGaps: ['Mammogram due', 'BP uncontrolled'],
  },
  {
    id: '4',
    patientId: 'patient-004',
    name: 'Rosa Flores',
    dob: '1961-05-18',
    preferredLanguage: 'es',
    briefStatus: 'pending',
    lastContact: '2026-03-15',
    lastOutreach: null,
    phone: '+15105550004',
    upcomingAppointment: '2026-04-17',
    conditions: ['Type 2 Diabetes', 'Hyperlipidemia'],
    careGaps: ['HbA1c overdue', 'Diabetic eye exam overdue', 'Foot exam overdue'],
  },
  {
    id: '5',
    patientId: 'patient-005',
    name: 'Miguel Torres',
    dob: '1970-09-03',
    preferredLanguage: 'es',
    briefStatus: 'pending',
    lastContact: '2026-01-20',
    lastOutreach: '2026-01-10',
    phone: '+15105550005',
    upcomingAppointment: '2026-04-22',
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Obesity'],
    careGaps: ['HbA1c overdue', 'BP uncontrolled', 'Depression screening due'],
  },
  {
    id: '6',
    patientId: 'patient-006',
    name: 'Carmen Reyes',
    dob: '1956-02-28',
    preferredLanguage: 'es',
    briefStatus: 'error',
    lastContact: '2026-03-10',
    lastOutreach: '2026-03-05',
    phone: '+15105550006',
    upcomingAppointment: '2026-04-18',
    conditions: ['Hypertension', 'Major Depressive Disorder'],
    careGaps: ['BP uncontrolled', 'Depression screening overdue'],
  },
  {
    id: '7',
    patientId: 'patient-007',
    name: 'Esperanza López',
    dob: '1983-06-12',
    preferredLanguage: 'es',
    briefStatus: 'sent',
    lastContact: '2026-04-01',
    lastOutreach: '2026-04-01',
    phone: '+15105550007',
    upcomingAppointment: '2026-04-21',
    conditions: ['Type 2 Diabetes', 'Gestational DM history'],
    careGaps: ['HbA1c overdue', 'Mammogram due'],
  },
  {
    id: '8',
    patientId: 'patient-008',
    name: 'Antonio Ramírez',
    dob: '1945-11-07',
    preferredLanguage: 'en',
    briefStatus: 'pending',
    lastContact: '2026-02-28',
    lastOutreach: '2026-02-28',
    phone: '+15105550008',
    upcomingAppointment: '2026-04-23',
    conditions: ['Type 2 Diabetes', 'Hypertension', 'CKD Stage 4'],
    careGaps: ['HbA1c overdue', 'BP uncontrolled', 'Nephrology follow-up due'],
  },
];

export const useCareNavigatorStore = create<CareNavigatorState>((set) => ({
  patients: DEMO_PATIENTS,
  setPatients: (patients) => set({ patients }),
  updateBriefStatus: (patientId, status) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.patientId === patientId ? { ...p, briefStatus: status } : p
      ),
    })),

  briefs: {},
  setBrief: (patientId, brief) =>
    set((state) => ({
      briefs: { ...state.briefs, [patientId]: brief },
    })),

  selectedPatientId: null,
  selectPatient: (id) => set({ selectedPatientId: id }),

  locale: 'es',
  setLocale: (locale) => set({ locale }),
}));
