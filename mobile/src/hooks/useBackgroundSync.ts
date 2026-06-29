import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { RootState } from '../store';
import { dequeueTask, incrementRetry, setSyncingStatus } from '../store/slices/syncSlice';
import { api } from '../services/api';
import { Toast } from '../components/PremiumToast';

export const useBackgroundSync = () => {
  const dispatch = useDispatch();
  const { queue, isSyncing } = useSelector((state: RootState) => state.sync);

  useEffect(() => {
    // Listen to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        processQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queue, isSyncing]);

  const processQueue = async () => {
    if (isSyncing || queue.length === 0) return;
    
    // Check actual internet reachability before starting
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) return;

    dispatch(setSyncingStatus(true));

    for (const task of queue) {
      if (task.retryCount >= 3) {
        // Drop task if it has failed too many times
        dispatch(dequeueTask(task.id));
        Toast.show({ title: 'Sinkronisasi Gagal', message: 'Beberapa data offline gagal disinkronkan ke server.', type: 'error' });
        continue;
      }

      try {
        const config = {
          method: task.method,
          url: task.url,
          data: task.body,
        };

        const response = await api(config);

        if (response.data?.success) {
          dispatch(dequeueTask(task.id));
          
          if (task.type === 'checkIn') {
            Toast.show({ title: 'Tersinkronisasi', message: 'Data absen offline berhasil dikirim ke server.', type: 'success' });
          }
        } else {
          throw new Error('API returned failure');
        }
      } catch (error) {
        console.error('Background sync failed for task:', task.id, error);
        dispatch(incrementRetry(task.id));
        // Stop processing the queue if network drops again or server is unreachable
        break; 
      }
    }

    dispatch(setSyncingStatus(false));
  };
};
