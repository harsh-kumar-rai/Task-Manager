import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload) => {
    const { data } = await api.post('/projects', payload);
    setProjects((prev) => [data.project, ...prev]);
    return data.project;
  };

  const joinProject = async (code) => {
    const { data } = await api.post('/projects/join', { code });
    setProjects((prev) => {
      const exists = prev.some((project) => project._id === data.project._id);
      if (exists) {
        return prev.map((project) => (project._id === data.project._id ? data.project : project));
      }
      return [data.project, ...prev];
    });
    return data.project;
  };

  return (
    <ProjectsContext.Provider value={{ projects, loading, fetchProjects, createProject, joinProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used inside ProjectsProvider');
  return ctx;
}
