import api from './api';

export async function fetchSubjects(search = '') {
  const params = search.trim() ? { search: search.trim() } : {};
  const { data } = await api.get('/subjects', { params });
  return data;
}

export async function fetchSubjectById(id) {
  const { data } = await api.get(`/subjects/${id}`);
  return data.subject;
}
