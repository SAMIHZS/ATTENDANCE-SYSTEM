import { apiClient } from './client';
export const teacherApi = {
  getLiveClass: async () => {
    const { data } = await apiClient.get('/teacher/live-class');
    return data.data; // { slot, teacher_id, date, existing_session }
  },

  getTodaySchedule: async () => {
    const { data } = await apiClient.get('/teacher/today-schedule');
    return data.data; // TimetableSlot[] with is_live and existing_session
  },

  startSession: async (payload: {
    class_id: string;
    date: string;
    start_time: string;
    end_time: string;
    subject_id: string;
    timetable_slot_id?: string;
  }) => {
    const { data } = await apiClient.post('/teacher/sessions/start', payload);
    return data.data; // { session, students }
  },

  getSessionDetails: async (sessionId: string) => {
    const { data } = await apiClient.get(`/teacher/sessions/${sessionId}`);
    return data.data; // { session, students, attendance }
  },

  overrideSubject: async (sessionId: string, actual_subject_id: string) => {
    const { data } = await apiClient.put(`/teacher/sessions/${sessionId}/override-subject`, {
      actual_subject_id,
    });
    return data.data; // updated session
  },

  saveAttendanceMarks: async (
    sessionId: string,
    marks: { student_id: string; status: 'present' | 'absent' }[]
  ) => {
    const { data } = await apiClient.put(`/teacher/sessions/${sessionId}/attendance`, { marks });
    return data.data; // [] of updated attendance records
  },

  submitSession: async (sessionId: string) => {
    const { data } = await apiClient.post(`/teacher/sessions/${sessionId}/submit`);
    return data.data; // { session, summary }
  },

  getHistory: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get(`/teacher/history?page=${page}&limit=${limit}`);
    return { data: data.data, meta: data.meta };
  },
};
