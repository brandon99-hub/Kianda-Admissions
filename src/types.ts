export type Step = 'candidate' | 'parent' | 'additional' | 'documents' | 'payment';

export interface SchoolHistory {
  type?: string;
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
  assessmentNo?: string;
  passportPhoto?: string;
  passportPhotoPreview?: string;
  schools: SchoolHistory[];
}

export interface ParentDetails {
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherProfession: string;
  fatherWork: string;
  fatherAltContactName: string;
  fatherAltContactPhone: string;
  fatherAltContactRelation: string;
  
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherProfession: string;
  motherWork: string;
  motherAltContactName: string;
  motherAltContactPhone: string;
  motherAltContactRelation: string;
  
  residency: string;
}

export interface Sibling {
  name: string;
  grade: string;
  relationship: string;
  schoolType?: string; // 'Kianda School', 'Other', or ''
  schoolName?: string;
  kiandaOrder?: string;
}

export interface AdditionalInfo {
  siblings: Sibling[];
  motivation: string;
  source: string;
  sourceOther?: string;
  hasAppliedBefore: boolean;
  previousApplicationYears: string[];
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
  highestStepIdx?: number;
  lastUpdated: string; // ISO string for expiry logic
}
