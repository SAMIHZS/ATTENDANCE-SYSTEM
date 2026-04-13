import { apiClient } from './client';

export interface AdminDashboardData {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  todaySessions: number;
  averageAttendance: number;
}

export interface AdminReportData {
  students: Array<{
    id: string;
    roll_number: string;
    classes: { name: string };
    attendance: Array<{
      status: string;
      count_data?: { total: number; attended: number };
      sessions: { actual_subject_id: string };
    }>;
  }>;
  subjectsMap: Record<string, string>;
  meta: {
    page: number;
    limit: number;
    totalStudents: number;
    totalPages: number;
  };
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data.data;
  },

  getReports: async (params?: { page?: number; limit?: number; classId?: string }): Promise<AdminReportData> => {
    const res = await apiClient.get('/admin/reports', { params });
    return res.data.data;
  },

  overrideAttendance: async (attendanceId: string, status: 'present' | 'absent'): Promise<void> => {
    const res = await apiClient.post('/admin/attendance/override', { attendanceId, status });
    return res.data;
  },

  // ─── CRUD ─────────────────────────────────────────────────────────

  getClasses: async () => {
    const res = await apiClient.get('/admin/classes');
    return res.data.data;
  },
  createClass: async (name: string) => {
    const res = await apiClient.post('/admin/classes', { name });
    return res.data.data;
  },
  updateClass: async (id: string, name: string) => {
    const res = await apiClient.put(`/admin/classes/${id}`, { name });
    return res.data.data;
  },

  getSubjects: async () => {
    const res = await apiClient.get('/admin/subjects');
    return res.data.data;
  },
  createSubject: async (name: string, code?: string) => {
    const res = await apiClient.post('/admin/subjects', { name, code });
    return res.data.data;
  },
  updateSubject: async (id: string, name: string, code?: string) => {
    const res = await apiClient.put(`/admin/subjects/${id}`, { name, code });
    return res.data.data;
  },

  getTeachers: async (params?: { search?: string; showInactive?: boolean }) => {
    const res = await apiClient.get('/admin/teachers', {
      params: {
        search: params?.search || undefined,
        showInactive: params?.showInactive ? 'true' : undefined
      }
    });
    return res.data.data;
  },
  createTeacher: async (body: { fullName: string; email: string; employeeId?: string; initialPassword?: string }) => {
    const res = await apiClient.post('/admin/teachers', body);
    return res.data;
  },
  updateTeacher: async (id: string, body: { fullName?: string; employeeId?: string; isActive?: boolean }) => {
    const res = await apiClient.put(`/admin/teachers/${id}`, body);
    return res.data.data;
  },

  getStudents: async (params?: { search?: string; classId?: string; showInactive?: boolean }) => {
    const res = await apiClient.get('/admin/students', {
      params: {
        search: params?.search || undefined,
        classId: params?.classId || undefined,
        showInactive: params?.showInactive ? 'true' : undefined,
      }
    });
    return res.data.data;
  },
  createStudent: async (body: { fullName: string; email?: string; classId: string; rollNumber: string }) => {
    const res = await apiClient.post('/admin/students', body);
    return res.data;
  },
  updateStudent: async (id: string, body: { fullName?: string; classId?: string; rollNumber?: string; isActive?: boolean }) => {
    const res = await apiClient.put(`/admin/students/${id}`, body);
    return res.data.data;
  },

  getClassSubjects: async (classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const res = await apiClient.get(`/admin/class-subjects${params}`);
    return res.data.data;
  },
  createClassSubject: async (body: any) => {
    const res = await apiClient.post('/admin/class-subjects', body);
    return res.data.data;
  },
  updateClassSubject: async (id: string, teacher_id: string) => {
    const res = await apiClient.put(`/admin/class-subjects/${id}`, { teacher_id });
    return res.data.data;
  },

  getTimetables: async (classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const res = await apiClient.get(`/admin/timetable${params}`);
    return res.data.data;
  },
  createTimetable: async (body: any) => {
    const res = await apiClient.post('/admin/timetable', body);
    return res.data.data;
  },
  updateTimetable: async (id: string, body: any) => {
    const res = await apiClient.put(`/admin/timetable/${id}`, body);
    return res.data.data;
  },
  deleteTimetable: async (id: string) => {
    const res = await apiClient.delete(`/admin/timetable/${id}`);
    return res.data;
  },

  getAttendanceSessions: async (classId?: string) => {
    const params = classId ? `?classId=${classId}` : '';
    const res = await apiClient.get(`/admin/attendance/sessions${params}`);
    return res.data.data;
  },
  getAttendanceSessionLogs: async (sessionId: string) => {
    const res = await apiClient.get(`/admin/attendance/sessions/${sessionId}`);
    return res.data.data;
  },

  // ─── EXPORTS (Phase 7) ──────────────────────────────────────────────

  exportClassReport: async (params: { classId: string; from?: string; to?: string }) => {
    const res = await apiClient.get('/admin/reports/export/class', { 
      params,
      responseType: 'blob' 
    });
    downloadBlob(res.data, `class_report_${params.classId}.csv`);
  },

  exportSubjectReport: async (params: { classId: string; subjectId: string; from?: string; to?: string }) => {
    const res = await apiClient.get('/admin/reports/export/subject', { 
      params,
      responseType: 'blob' 
    });
    downloadBlob(res.data, `subject_report_${params.subjectId}.csv`);
  },

  exportSessionsReport: async (params: { classId: string; from?: string; to?: string }) => {
    const res = await apiClient.get('/admin/reports/export/sessions', { 
      params,
      responseType: 'blob' 
    });
    downloadBlob(res.data, `session_logs_${params.classId}.csv`);
  }
};

/**
 * Helper to trigger a browser download for a blob response
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
