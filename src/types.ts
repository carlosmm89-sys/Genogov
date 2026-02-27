import { v4 as uuidv4 } from 'uuid';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum RelationType {
  BLOOD = 'blood',
  MARRIAGE = 'marriage',
  DIVORCE = 'divorce',
  COHABITATION = 'cohabitation',
  SEPARATION = 'separation',
  CONFLICT = 'conflict',
  CLOSE = 'close',
  DISTANT = 'distant'
}

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Individual {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  dni?: string;
  riskLevel: RiskLevel;
  notes?: string;
  photoUrl?: string;
  isDeceased?: boolean;
  resources?: string[]; // Municipal aids, resources
  vulnerabilities?: string[]; // Specific issues like disability, unemployment
}

export interface Family {
  id: string;
  parent1Id?: string;
  parent2Id?: string;
  childrenIds: string[];
  relationType: RelationType;
  marriageDate?: string;
  divorceDate?: string;
}

export const createIndividual = (data: Partial<Individual>): Individual => ({
  id: uuidv4(),
  firstName: '',
  lastName: '',
  gender: Gender.OTHER,
  riskLevel: RiskLevel.NONE,
  isDeceased: false,
  ...data
});

export const createFamily = (data: Partial<Family>): Family => ({
  id: uuidv4(),
  childrenIds: [],
  relationType: RelationType.BLOOD,
  ...data
});
