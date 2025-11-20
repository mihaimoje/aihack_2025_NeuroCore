const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to create headers
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  register: async (name: string, username: string, email: string, password: string, role?: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password, role }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/projects`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  getUserProjects: async (userId: string) => {
    const response = await fetch(`${API_URL}/projects/user/${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user projects');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  },

  addMember: async (projectId: string, userId: string) => {
    const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to add member');
    return response.json();
  },

  removeMember: async (projectId: string, userId: string) => {
    const response = await fetch(`${API_URL}/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove member');
    return response.json();
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (filters?: { projectId?: string; assignedTo?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.status) params.append('status', filters.status);
    
    const url = params.toString() ? `${API_URL}/tasks?${params}` : `${API_URL}/tasks`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  },
};

// Teams API
export const teamsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/teams`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete team');
    return response.json();
  },

  removeMember: async (teamId: string, userId: string) => {
    const response = await fetch(`${API_URL}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove member from team');
    return response.json();
  },
};

// Burnout API
export const burnoutApi = {
  getAll: async (filters?: { userId?: string; week?: number; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.week) params.append('week', filters.week.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    
    const url = params.toString() ? `${API_URL}/burnout?${params}` : `${API_URL}/burnout`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch burnout scores');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/burnout/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch burnout score');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/burnout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create burnout score');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/burnout/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update burnout score');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/burnout/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete burnout score');
    return response.json();
  },
};

// Insights API
export const insightsApi = {
  getAll: async (filters?: { teamId?: string; projectId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.teamId) params.append('teamId', filters.teamId);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    
    const url = params.toString() ? `${API_URL}/insights?${params}` : `${API_URL}/insights`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/insights/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch insight');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/insights`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create insight');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/insights/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update insight');
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/insights/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete insight');
    return response.json();
  },
};
