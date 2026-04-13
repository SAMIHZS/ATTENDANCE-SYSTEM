import { apiClient } from './client';

export const studentApi = {
  getSummary: async () => {
    const { data } = await apiClient.get('/student/attendance/summary');
    return data.data; // { overall: { percentage, total, attended, absent }, subjects: [] }
  },

  getHistory: async (filters?: { subjectId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (filters?.subjectId) query.append('subjectId', filters.subjectId);
    if (filters?.date) query.append('date', filters.date);
    
    const { data } = await apiClient.get(`/student/attendance/history?${query.toString()}`);
    return data.data; // [] of flat history records
  },

  /** Fetch all classes — uses the shared /classes route (accessible to all authenticated users) */
  getClasses: async () => {
    const { data } = await apiClient.get('/classes');
    return data.data;
  },
};
