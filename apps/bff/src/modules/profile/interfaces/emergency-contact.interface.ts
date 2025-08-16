export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface EmergencyContactsData {
  contacts: EmergencyContact[];
  updatedAt: string;
}