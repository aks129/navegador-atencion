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

// Demo patients for navigator console
const DEMO_PATIENTS: WorkQueueItem[] = [
  {
    id: '1',
    patientId: 'patient-001',
    name: 'María García',
    dob: '1968-03-15',
    preferredLanguage: 'es',
    briefStatus: 'pending',
    lastContact: '2025-12-01',
    phone: '+15105550001',
    upcomingAppointment: '2026-04-15',
  },
  {
    id: '2',
    patientId: 'patient-002',
    name: 'Jose Hernández',
    dob: '1952-07-22',
    preferredLanguage: 'es',
    briefStatus: 'sent',
    lastContact: '2026-04-08',
    phone: '+15105550002',
    upcomingAppointment: '2026-04-14',
  },
  {
    id: '3',
    patientId: 'patient-003',
    name: 'Ana Martínez',
    dob: '1975-11-30',
    preferredLanguage: 'es',
    briefStatus: 'viewed',
    lastContact: '2026-04-07',
    phone: '+15105550003',
    upcomingAppointment: '2026-04-16',
  },
  {
    id: '4',
    patientId: 'patient-004',
    name: 'Robert Chen',
    dob: '1961-05-18',
    preferredLanguage: 'en',
    briefStatus: 'pending',
    lastContact: '2026-04-05',
    phone: '+15105550004',
    upcomingAppointment: '2026-04-17',
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
