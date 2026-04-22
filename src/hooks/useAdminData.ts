import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authFetch } from '../utils/auth';

// API Fetchers
const fetchApplications = () => authFetch('/api/admin/applications').then(res => res.json());
const fetchGrades = () => authFetch('/api/admin/grades').then(res => res.json());
const fetchAssessments = () => authFetch('/api/admin/assessments').then(res => res.json());
const fetchInterviews = () => authFetch('/api/admin/interviews').then(res => res.json());
const fetchResults = () => authFetch('/api/admin/results').then(res => res.json());

// Main Data Hooks
export const useApplications = () => useQuery({
  queryKey: ['applications'],
  queryFn: fetchApplications,
  staleTime: 5000,
});

export const useGrades = () => useQuery({
  queryKey: ['grades'],
  queryFn: fetchGrades,
  staleTime: 10000,
});

export const useAssessments = () => useQuery({
  queryKey: ['assessments'],
  queryFn: fetchAssessments,
  staleTime: 10000,
});

export const useInterviews = () => useQuery({
  queryKey: ['interviews'],
  queryFn: fetchInterviews,
  staleTime: 5000,
});

export const useResults = () => useQuery({
  queryKey: ['results'],
  queryFn: fetchResults,
  staleTime: 5000,
});

// Mutations
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, status, reason }: { applicationId: number, status: string, reason?: string }) => {
      const res = await authFetch('/api/admin/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status, reason })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`Application ${variables.status.replace('_', ' ')} successfully.`);
    },
    onError: () => {
      toast.error('Failed to update application status.');
    }
  });
};

export const useBulkSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (results: any[]) => {
      const res = await authFetch('/api/admin/results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Excel results synchronized successfully.');
    },
    onError: () => {
      toast.error('Synchronization failed.');
    }
  });
};

export const useCreateInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch('/api/admin/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Scheduling failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Interview(s) scheduled and parents notified.');
    }
  });
};

export const useRecordInterviewOutcome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch('/api/admin/interviews/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Outcome recording failed');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['grades'] }); // For vacancy decrement
      toast.success(`Outcome recorded: ${variables.outcome}`);
    }
  });
};

export const useCreateGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch('/api/admin/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create/update grade');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade status updated.');
    }
  });
};

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/admin/grades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete grade');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade removed from system.');
    }
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create/update assessment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment structure updated.');
    }
  });
};

export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/admin/assessments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete assessment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment removed.');
    }
  });
};
