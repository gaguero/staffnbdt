import api from './api';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'PROPERTY_MANAGER' | 'DEPARTMENT_ADMIN' | 'STAFF';
  propertyId?: string;
  departmentId?: string;
  invitedBy: string;
  invitedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationData {
  email: string;
  role: string;
  departmentId?: string;
  propertyId?: string;
}

export interface InvitationFilter {
  status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  role?: string;
  departmentId?: string;
  search?: string;
}

export interface AcceptInvitationData {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
}

class InvitationService {
  async getInvitations(filter?: InvitationFilter): Promise<{ data: Invitation[], total: number }> {
    const response = await api.get('/invitations', {
      params: filter,
    });
    return response.data;
  }

  async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    const response = await api.post('/invitations', data);
    return response.data.data;
  }

  async getInvitationById(id: string): Promise<Invitation> {
    const response = await api.get(`/invitations/${id}`);
    return response.data.data;
  }

  async getInvitationByToken(token: string): Promise<Invitation> {
    const response = await api.get(`/invitations/token/${token}`);
    return response.data.data;
  }

  async resendInvitation(id: string): Promise<{ success: boolean }> {
    const response = await api.post(`/invitations/${id}/resend`);
    return response.data.data;
  }

  async cancelInvitation(id: string): Promise<{ success: boolean }> {
    const response = await api.post(`/invitations/${id}/cancel`);
    return response.data.data;
  }

  async acceptInvitation(data: AcceptInvitationData): Promise<{ user: any, token: string }> {
    const response = await api.post('/invitations/accept', data);
    return response.data.data;
  }

  async getInvitationStats(): Promise<InvitationStats> {
    const response = await api.get('/invitations/stats');
    return response.data.data;
  }

  async getUserInvitations(userId: string): Promise<Invitation[]> {
    const response = await api.get(`/invitations/user/${userId}`);
    return response.data.data;
  }

  async getDepartmentInvitations(departmentId: string): Promise<Invitation[]> {
    const response = await api.get(`/invitations/department/${departmentId}`);
    return response.data.data;
  }

  async bulkInvite(invitations: CreateInvitationData[]): Promise<{
    successCount: number;
    failureCount: number;
    failed: Array<{ email: string; error: string }>;
  }> {
    const response = await api.post('/invitations/bulk', { invitations });
    return response.data.data;
  }
}

export const invitationService = new InvitationService();
export default invitationService;