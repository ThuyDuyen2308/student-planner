import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';
import AssignmentSection from '../components/AssignmentSection';
import Toast from '../components/Toast';

export default function AssignmentsPage() {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    try {
      const [resAssignments, resSubjects] = await Promise.all([
        axios.get(`${API_URL}/api/assignments`, config),
        axios.get(`${API_URL}/api/subjects`, config)
      ]);
      setAssignments(resAssignments.data || []);
      setSubjects(resSubjects.data || []);
    } catch (error) {
      console.error('Fetch assignments page data error:', error);
      addToast('Không thể tải công việc hoặc môn học.', 'error');
    }
  }, [token, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <AssignmentSection
        assignments={assignments}
        subjects={subjects}
        onAssignmentChange={fetchData}
        addToast={addToast}
        API_URL={API_URL}
        token={token}
      />
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
