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
  }
};
