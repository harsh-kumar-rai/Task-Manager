import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats');
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const createTask = async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    setTasks((prev) => [data.task, ...prev]);
    return data.task;
  };

  const updateTask = async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
    return data.task;
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const createCategory = async (catData) => {
    const { data } = await api.post('/categories', catData);
    setCategories((prev) => [...prev, data.category]);
    return data.category;
  };

  const deleteCategory = async (id) => {
    await api.delete(`/categories/${id}`);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks, stats, categories, loading, pagination,
        fetchTasks, fetchStats, fetchCategories,
        createTask, updateTask, deleteTask,
        createCategory, deleteCategory,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be inside TaskProvider');
  return ctx;
}
