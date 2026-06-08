import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Carrier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'queued' | 'arrived' | 'loading' | 'completed' | 'released' | 'cancelled';
export type OperationType = 'load' | 'unload' | 'both';

export interface Appointment {
  id: number;
  appointmentNo: string;
  carrierId: number;
  carrier?: Carrier;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  operationType: OperationType;
  totalPackages: number;
  handledPackages: number;
  actualPackages: number;
  scheduledTime?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: AppointmentStatus;
  dockNumber?: string;
  detentionFee: number;
  detentionPaid: boolean;
  standardDurationMinutes: number;
  detentionRatePerMinute: number;
  needsReview: boolean;
  reviewNote?: string;
  remarks?: string;
  boundaryCheckPassed: boolean;
  boundaryCheckNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseRecord {
  id: number;
  releaseNo: string;
  appointmentId: number;
  appointment?: Appointment;
  plateNumber: string;
  carrierName: string;
  totalPackages: number;
  handledPackages: number;
  actualPackages: number;
  detentionFee: number;
  detentionPaid: boolean;
  needsReview: boolean;
  releasedAt: string;
  releasedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface ComputeDetentionResult {
  appointment: Appointment;
  fee: number;
  overtimeMinutes: number;
  actualMinutes: number;
}

export interface SubmitActualPackagesResult {
  appointment: Appointment;
  needsReview: boolean;
  diffPercent: number;
}

export const carriersApi = {
  list: () => api.get<Carrier[]>('/carriers').then((r) => r.data),
  create: (data: Partial<Carrier>) => api.post<Carrier>('/carriers', data).then((r) => r.data),
};

export const appointmentsApi = {
  list: (status?: AppointmentStatus) =>
    api.get<Appointment[]>('/appointments', { params: { status } }).then((r) => r.data),
  pending: () => api.get<Appointment[]>('/appointments/pending').then((r) => r.data),
  processing: () => api.get<Appointment[]>('/appointments/processing').then((r) => r.data),
  released: () => api.get<Appointment[]>('/appointments/released').then((r) => r.data),
  create: (data: any) => api.post<Appointment>('/appointments', data).then((r) => r.data),
  update: (id: number, data: any) => api.put<Appointment>(`/appointments/${id}`, data).then((r) => r.data),
  queueCheck: (id: number) => api.post<{ passed: boolean; note: string }>(`/appointments/${id}/queue-check`).then((r) => r.data),
  handlePackages: (id: number, packages: number) =>
    api.post<Appointment>(`/appointments/${id}/handle-packages`, { packages }).then((r) => r.data),
  submitActualPackages: (id: number, actualPackages: number, reviewNote?: string) =>
    api.post<SubmitActualPackagesResult>(`/appointments/${id}/submit-actual-packages`, {
      actualPackages,
      reviewNote,
    }).then((r) => r.data),
  computeDetentionFee: (id: number) =>
    api.get<ComputeDetentionResult>(`/appointments/${id}/compute-detention-fee`).then((r) => r.data),
  payDetention: (id: number, paid: boolean = true, detentionFee?: number) =>
    api.post<Appointment>(`/appointments/${id}/pay-detention`, { paid, detentionFee }).then((r) => r.data),
};

export const releasesApi = {
  list: (params?: any) => api.get<ReleaseRecord[]>('/releases', { params }).then((r) => r.data),
  create: (data: any) => api.post<ReleaseRecord>('/releases', data).then((r) => r.data),
};

export default api;
