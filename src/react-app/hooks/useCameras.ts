import { useState, useEffect } from 'react';
import { Camera, CameraFormData } from '@/shared/types';

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cameras
  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cameras');
      if (!response.ok) throw new Error('Failed to fetch cameras');
      const data = await response.json();
      setCameras(data.cameras || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  // Add camera
  const addCamera = async (cameraData: CameraFormData) => {
    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cameraData),
      });
      if (!response.ok) throw new Error('Failed to add camera');
      const data = await response.json();
      setCameras(prev => [data.camera, ...prev]);
      return data.camera;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add camera');
    }
  };

  // Update camera
  const updateCamera = async (id: number, cameraData: Partial<CameraFormData>) => {
    try {
      const response = await fetch(`/api/cameras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cameraData),
      });
      if (!response.ok) throw new Error('Failed to update camera');
      const data = await response.json();
      setCameras(prev => prev.map(camera => camera.id === id ? data.camera : camera));
      return data.camera;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update camera');
    }
  };

  // Delete camera
  const deleteCamera = async (id: number) => {
    try {
      const response = await fetch(`/api/cameras/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete camera');
      setCameras(prev => prev.filter(camera => camera.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete camera');
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  return {
    cameras,
    loading,
    error,
    addCamera,
    updateCamera,
    deleteCamera,
    refetch: fetchCameras,
  };
}
