export type Step = 'candidate' | 'parent' | 'additional' | 'documents' | 'payment';

export interface SchoolHistory {
  name: string;
  years: string;
}

export interface CandidateInfo {
  grade: string;
  fullName: string;
  dob: string;
  religion: string;
  denomination: string;
  birthOrder: string;
  medicalInfo: string;
  schools: {
    kindergarten: SchoolHistory;
    primary: SchoolHistory;
    junior: SchoolHistory;
  };
}

export interface ParentDetails {
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherProfession: string;
  fatherWork: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherProfession: string;
  motherWork: string;
}

export interface Sibling {
  name: string;
  grade: string;
  relationship: string;
}

export interface AdditionalInfo {
  siblings: Sibling[];
  motivation: string;
  source: string;
  sourceOther?: string;
  hasAppliedBefore: boolean;
  previousApplicationYear?: string;
}

export interface PaymentDetails {
  mpesaCode: string;
}

export interface ApplicationState {
  currentStep: Step;
  candidate: CandidateInfo;
  parent: ParentDetails;
  additional: AdditionalInfo;
  payment: PaymentDetails;
  documents: Record<string, string>;
  consentGiven: boolean;
  lastUpdated: string; // ISO string for expiry logic
}
