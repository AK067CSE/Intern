import axios from 'axios';
import { Student, ContestHistory, ProblemStats } from '../types/student';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getStudents = async () => {
  const res = await api.get<Student[]>('/students');
  // If the response is an array, wrap it in an object for compatibility
  if (Array.isArray(res.data)) {
    return { students: res.data };
  }
  // If the response is already an object with students, return as is
  return res.data;
};
export const getStudentProfile = (id: number) => api.get(`/students/${id}`);
export const getContestHistory = (id: number, days: number) => 
  api.get<ContestHistory[]>(`/students/${id}/contest-history?days=${days}`);
export const getProblemStats = (id: number, days: number) => 
  api.get<ProblemStats>(`/students/${id}/problem-stats?days=${days}`);
export const addStudent = async (student: Partial<Student>) => {
  return api.post('/students', student);
};
export const updateStudent = async (student: Student) => {
  return api.put(`/students/${student.id}`, student);
};
export const deleteStudent = async (id: number) => {
  return api.delete(`/students/${id}`);
};
export const syncStudent = async (cf_handle: string) => {
  return api.post(`/sync/${cf_handle}`);
}; 