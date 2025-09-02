import api from './api';
import {
  ConciergeObject,
  ConciergeObjectFilter,
  ObjectType,
  Playbook,
  CreateConciergeObjectInput,
  UpdateConciergeObjectInput,
  CreateObjectTypeInput,
  ExecutePlaybookInput,
  TodayBoardSection,
  ReservationChecklist,
  GuestTimelineEvent,
  ConciergeStats,
} from '../types/concierge';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ConciergeService {
  // Concierge Objects Management
  async getObjects(filter?: ConciergeObjectFilter): Promise<ApiResponse<PaginatedResponse<ConciergeObject>>> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type.join(','));
    if (filter?.status) params.append('status', filter.status.join(','));
    if (filter?.search) params.append('search', filter.search);
    if (filter?.reservationId) params.append('reservationId', filter.reservationId);
    if (filter?.guestId) params.append('guestId', filter.guestId);
    if (filter?.assignedTo) params.append('assignedTo', filter.assignedTo);
    if (filter?.overdue !== undefined) params.append('overdue', filter.overdue.toString());
    if (filter?.dueRange) {
      params.append('dueStart', filter.dueRange.start.toISOString());
      params.append('dueEnd', filter.dueRange.end.toISOString());
    }

    const response = await api.get(`/concierge/objects?${params.toString()}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        data: response.data.data.data.map((obj: any) => this.transformConciergeObject(obj))
      }
    };
  }

  async getObject(id: string): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.get(`/concierge/objects/${id}`);
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }

  async createObject(input: CreateConciergeObjectInput): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.post('/concierge/objects', input);
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }

  async updateObject(id: string, input: UpdateConciergeObjectInput): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.patch(`/concierge/objects/${id}`, input);
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }

  async deleteObject(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/concierge/objects/${id}`);
    return response.data;
  }

  async completeObject(id: string, completionNotes?: string): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.post(`/concierge/objects/${id}/complete`, { notes: completionNotes });
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }

  async assignObject(id: string, userId: string): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.post(`/concierge/objects/${id}/assign`, { userId });
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }

  // Object Types Management
  async getObjectTypes(): Promise<ApiResponse<ObjectType[]>> {
    const response = await api.get('/concierge/object-types');
    return response.data;
  }

  async getObjectType(id: string): Promise<ApiResponse<ObjectType>> {
    const response = await api.get(`/concierge/object-types/${id}`);
    return response.data;
  }

  async createObjectType(input: CreateObjectTypeInput): Promise<ApiResponse<ObjectType>> {
    const response = await api.post('/concierge/object-types', input);
    return response.data;
  }

  async updateObjectType(id: string, input: Partial<CreateObjectTypeInput>): Promise<ApiResponse<ObjectType>> {
    const response = await api.patch(`/concierge/object-types/${id}`, input);
    return response.data;
  }

  async deleteObjectType(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/concierge/object-types/${id}`);
    return response.data;
  }

  // Playbooks Management
  async getPlaybooks(): Promise<ApiResponse<Playbook[]>> {
    const response = await api.get('/concierge/playbooks');
    return response.data;
  }

  async executePlaybook(input: ExecutePlaybookInput): Promise<ApiResponse<any>> {
    const response = await api.post('/concierge/playbooks/execute', input);
    return response.data;
  }

  // View-specific API calls
  async getTodayBoard(): Promise<ApiResponse<TodayBoardSection[]>> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const [overdue, dueToday, upcoming] = await Promise.all([
      this.getObjects({ 
        overdue: true,
        status: ['open', 'in_progress'] 
      }),
      this.getObjects({ 
        dueRange: { start: startOfDay, end: endOfDay },
        status: ['open', 'in_progress'] 
      }),
      this.getObjects({ 
        dueRange: { start: endOfDay, end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: ['open', 'in_progress'] 
      })
    ]);

    const sections: TodayBoardSection[] = [
      {
        title: 'Overdue',
        status: ['overdue'],
        objects: overdue.data.data,
        count: overdue.data.total
      },
      {
        title: 'Due Today', 
        status: ['open', 'in_progress'],
        objects: dueToday.data.data,
        count: dueToday.data.total
      },
      {
        title: 'Upcoming',
        status: ['open'],
        objects: upcoming.data.data,
        count: upcoming.data.total
      }
    ];

    return {
      data: sections,
      message: 'Today board data retrieved successfully',
      success: true
    };
  }

  async getReservationChecklist(reservationId: string): Promise<ApiResponse<ReservationChecklist>> {
    const response = await api.get(`/concierge/reservations/${reservationId}/checklist`);
    return response.data;
  }

  async getGuestTimeline(guestId: string): Promise<ApiResponse<GuestTimelineEvent[]>> {
    const response = await api.get(`/concierge/guests/${guestId}/timeline`);
    return response.data;
  }

  async getStats(): Promise<ApiResponse<ConciergeStats>> {
    const response = await api.get('/concierge/stats');
    return response.data;
  }

  // Bulk Operations
  async bulkUpdateStatus(objectIds: string[], status: string): Promise<ApiResponse<void>> {
    const response = await api.post('/concierge/objects/bulk/status', {
      objectIds,
      status
    });
    return response.data;
  }

  async bulkAssign(objectIds: string[], userId: string): Promise<ApiResponse<void>> {
    const response = await api.post('/concierge/objects/bulk/assign', {
      objectIds,
      userId
    });
    return response.data;
  }

  async bulkComplete(objectIds: string[], completionNotes?: string): Promise<ApiResponse<void>> {
    const response = await api.post('/concierge/objects/bulk/complete', {
      objectIds,
      notes: completionNotes
    });
    return response.data;
  }

  // Helper methods
  private transformConciergeObject(obj: any): ConciergeObject {
    return {
      ...obj,
      dueAt: obj.dueAt ? new Date(obj.dueAt) : undefined,
      createdAt: new Date(obj.createdAt),
      updatedAt: new Date(obj.updatedAt),
      deletedAt: obj.deletedAt ? new Date(obj.deletedAt) : undefined,
      attributes: obj.attributes || [],
      assignments: obj.assignments || {},
      files: obj.files || {}
    };
  }

  // Template Creation
  async createFromTemplate(templateId: string, data: Record<string, any>): Promise<ApiResponse<ConciergeObject>> {
    const response = await api.post('/concierge/templates/create', {
      templateId,
      data
    });
    return {
      ...response.data,
      data: this.transformConciergeObject(response.data.data)
    };
  }
}

export const conciergeService = new ConciergeService();
export default conciergeService;

// Re-export types for backward compatibility
export type {
  ConciergeObject,
  ConciergeObjectFilter,
  ObjectType,
  Playbook,
  CreateConciergeObjectInput,
  UpdateConciergeObjectInput,
  CreateObjectTypeInput,
  ExecutePlaybookInput,
  TodayBoardSection,
  ReservationChecklist,
  GuestTimelineEvent,
  ConciergeStats,
  ConciergeObjectStatus,
  AttributeFieldType,
  ObjectFieldDefinition,
} from '../types/concierge';
