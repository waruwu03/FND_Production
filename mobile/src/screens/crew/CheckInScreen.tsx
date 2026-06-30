import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import { Toast } from '../../components/PremiumToast';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { enqueueTask } from '../../store/slices/syncSlice';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, InfoRow } from '../../components/FndUi';
import { getEventStatusMeta, getLocationParts, getEventImage } from '../../utils/fnd';
import MapView, { Marker, Circle } from 'react-native-maps';

type CheckStatus = 'idle' | 'checkedIn' | 'checkedOut';

const DEFAULT_EVENT = {
  id: 0,
  name: 'Wedding Andi & Sinta',
  location: 'Sesot Location, Rentaparn, Ceomonce Soria',
  reference_images: '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80"]',
};

// Haversine distance helper
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export const CheckInScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const event = useMemo(
    () => tasks.find((task) => !['selesai', 'cancel'].includes(String(task.status).toLowerCase())) || tasks[0] || DEFAULT_EVENT,
    [tasks],
  );


  const [eventCoords, setEventCoords] = useState<{ latitude: number, longitude: number }>({
    latitude: -6.2088,
    longitude: 106.8456,
  });

  useEffect(() => {
    const geocodeEventLocation = async () => {
      if (!event?.location) return;
      try {
        const results = await Location.geocodeAsync(event.location);
        if (results && results.length > 0) {
          setEventCoords({
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          });
        }
      } catch (err) {
        console.log('Geocoding error:', err);
      }
    };
    geocodeEventLocation();
  }, [event?.location]);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/events/assigned');
      if (response.data?.success) {
        setTasks(response.data.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchCheckInStatus = async () => {
    if (!event?.id) return;
    try {
      // Attempt to get status from the server
      const response = await api.get(`/events/${event.id}/checkin`);
      if (response.data?.success && response.data.data) {
        const checkinData = response.data.data;
        if (checkinData.check_out_at) {
          setStatus('checkedOut');
        } else if (checkinData.check_in_at) {
          setStatus('checkedIn');
        } else {
          setStatus('idle');
        }
      } else {
        // Fallback to AsyncStorage
        const saved = await AsyncStorage.getItem(`fnd-checkin-${event.id}`);
        if (saved === 'checkedIn' || saved === 'checkedOut') setStatus(saved);
        else setStatus('idle');
      }
    } catch {
      // Fallback to AsyncStorage
      const saved = await AsyncStorage.getItem(`fnd-checkin-${event.id}`);
      if (saved === 'checkedIn' || saved === 'checkedOut') setStatus(saved);
      else setStatus('idle');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchCheckInStatus();
  }, [event?.id]);

  // Monitor location to calculate real geofence distance
  useEffect(() => {
    let watchSubscription: any;
    const startWatching = async () => {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus !== 'granted') return;

        let loc = await Location.getLastKnownPositionAsync({});
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        setUserLocation(loc);
        
        if (loc) {
          const dist = getDistance(
            loc.coords.latitude,
            loc.coords.longitude,
            eventCoords.latitude,
            eventCoords.longitude
          );
          setDistance(Math.round(dist));
        }

        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 8000,
            distanceInterval: 10,
          },
          (newLoc) => {
            setUserLocation(newLoc);
            const nextDist = getDistance(
              newLoc.coords.latitude,
              newLoc.coords.longitude,
              eventCoords.latitude,
              eventCoords.longitude
            );
            setDistance(Math.round(nextDist));
          }
        );
      } catch (err) {
        console.error('Error tracking location:', err);
      }
    };

    startWatching();
    return () => {
      if (watchSubscription) watchSubscription.remove();
    };
  }, [eventCoords]);

  const proceedCheckIn = async (loc: Location.LocationObject) => {
    try {
      const response = await api.post(`/events/${event.id}/checkin`, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (response.data?.success) {
        await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedIn');
        setStatus('checkedIn');
        Toast.show({ title: 'Check-In Berhasil! 🎉', message: 'Kehadiran Anda di area geofence berhasil dicatat.', type: 'success' });
      } else {
        throw new Error(response.data?.error || 'Gagal menyimpan data check-in.');
      }
    } catch (error: any) {
      // Fallback local checkin in case server offline
      dispatch(enqueueTask({
        url: `/events/${event.id}/checkin`,
        method: 'POST',
        body: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: new Date().toISOString(),
        },
        type: 'checkIn',
        timestamp: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedIn');
      setStatus('checkedIn');
      Toast.show({ title: 'Disimpan di Antrean (Offline)', message: 'Sinyal terputus. Data absen akan diunggah otomatis saat jaringan stabil.', type: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!event?.id) return;
    setIsLoading(true);
    try {
      // Get position quickly without hanging
      let loc = userLocation;
      if (!loc) {
        loc = await Location.getLastKnownPositionAsync({});
      }
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      if (!loc) {
        throw new Error('Tidak dapat mendeteksi lokasi GPS Anda.');
      }

      setUserLocation(loc);
      const dist = getDistance(
        loc.coords.latitude,
        loc.coords.longitude,
        eventCoords.latitude,
        eventCoords.longitude
      );
      setDistance(Math.round(dist));

      // Geofence restriction (100 meters).
      // Bypass geofence check automatically if running on emulator (typical US coords)
      const isEmulator = loc.coords.latitude > 30 || loc.coords.latitude < -30;
      const isWithinGeofence = dist <= 100;
      
      if (!isWithinGeofence && !isEmulator) {
        Alert.alert(
          'Luar Jangkauan Geofence',
          `Jarak Anda terlalu jauh (${Math.round(dist)} m). Apakah Anda yakin ingin tetap melakukan check-in?`,
          [
            {
              text: 'Batal',
              style: 'cancel',
              onPress: () => setIsLoading(false)
            },
            {
              text: 'Ya, Tetap Check-in',
              onPress: () => proceedCheckIn(loc)
            }
          ]
        );
        return;
      }

      await proceedCheckIn(loc);
    } catch (error: any) {
      // Fallback local checkin in case location fails entirely
      dispatch(enqueueTask({
        url: `/events/${event.id}/checkin`,
        method: 'POST',
        body: {
          latitude: eventCoords.latitude,
          longitude: eventCoords.longitude,
          timestamp: new Date().toISOString(),
        },
        type: 'checkIn',
        timestamp: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedIn');
      setStatus('checkedIn');
      Toast.show({ title: 'Disimpan di Antrean (Offline)', message: 'Sinyal terputus. Data absen akan diunggah otomatis.', type: 'info' });
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!event?.id) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/events/${event.id}/checkout`);
      if (response.data?.success) {
        await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedOut');
        setStatus('checkedOut');
        Toast.show({ title: 'Check-Out Berhasil! 🏁', message: 'Tugas Anda selesai dan telah berhasil dicatat.', type: 'success' });
      } else {
        throw new Error(response.data?.error || 'Gagal check-out.');
      }
    } catch (error: any) {
      dispatch(enqueueTask({
        url: `/events/${event.id}/checkout`,
        method: 'POST',
        body: { timestamp: new Date().toISOString() },
        type: 'checkOut',
        timestamp: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedOut');
      setStatus('checkedOut');
      Toast.show({ title: 'Disimpan di Antrean (Offline)', message: 'Sinyal terputus. Waktu selesai akan diunggah otomatis.', type: 'info' });
    } finally {
      setIsLoading(false);
    }
  };

  const location = getLocationParts(event || {});
  const isWithinGeofence = distance !== null && distance <= 100;

  const eventImageUrl = useMemo(() => {
    const imagePath = getEventImage(event);
    return getAssetUrl(imagePath) || imagePath;
  }, [event]);

  return (
    <View style={styles.container}>
      {/* Background Interactive Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: eventCoords.latitude,
          longitude: eventCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        region={{
          latitude: eventCoords.latitude,
          longitude: eventCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <Marker coordinate={eventCoords}>
          <View style={{ alignItems: 'center', justifyContent: 'center', shadowColor: '#F97316', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}>
            <Ionicons name="location" size={42} color="#F97316" />
          </View>
        </Marker>
        <Circle
          center={eventCoords}
          radius={100}
          strokeWidth={2}
          strokeColor="rgba(249, 115, 22, 0.8)"
          fillColor="rgba(249, 115, 22, 0.15)"
        />
      </MapView>

      {/* Floating Header Actions */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Beranda')}
        className="absolute left-5 h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-800 z-20"
        style={[{ top: insets.top + 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }]}
      >
        <Ionicons name="chevron-back" size={24} color="#94A3B8" />
      </TouchableOpacity>

      <View className="absolute right-5 items-center z-20" style={[{ top: insets.top + 12 }]}>
        <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-800 mb-2.5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
          <Ionicons name="compass" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-slate-800" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
          <Ionicons name="navigate" size={18} color="#94A3B8" style={{ transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
      </View>

      <View className="absolute self-center flex-row items-center bg-white dark:bg-slate-800 rounded-full px-4 py-2 z-20" style={[{ top: insets.top + 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }]}>
        <View className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
        <Text className="text-[10px] font-black text-primary dark:text-slate-100">Geofence</Text>
      </View>



      {/* Bottom Floating Container */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 90 }]}>
        {/* Floating status row */}
        <View className="flex-row justify-between mb-2.5">
          <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Ionicons name="location" size={14} color="#94A3B8" />
            <Text className="ml-1 text-[9px] font-black text-primary dark:text-slate-100">Geofence</Text>
          </View>
          <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Ionicons
              name={isWithinGeofence ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={isWithinGeofence ? '#10B981' : '#F59E0B'}
            />
            <Text className="ml-1 text-[9px] font-black text-primary dark:text-slate-100">
              {distance !== null ? `${distance} m` : 'Calculating...'}
            </Text>
          </View>
        </View>

        {/* Bottom White Card */}
        <View className="bg-white dark:bg-slate-900 rounded-[24px] p-4" style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
          <View className="flex-row items-center mb-4">
            <Image source={{ uri: eventImageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80' }} className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800" resizeMode="cover" />
            <View className="ml-3 flex-1">
              <Text className="text-[13px] font-black text-primary dark:text-slate-100" numberOfLines={1}>{location.venue || 'Hotel Mulia Jakarta'}</Text>
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>{event.name || 'Wedding Andi & Sinta'}</Text>
              <Text className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>{location.address || 'Jakarta'}</Text>
            </View>
          </View>

          {/* Action button */}
          {status === 'idle' ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F97316' }]}
              onPress={handleCheckIn}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Memproses...' : 'Check-in Sekarang'}
              </Text>
            </TouchableOpacity>
          ) : status === 'checkedIn' ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={handleCheckOut}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Memproses...' : 'Check-out Sekarang'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionButton, { backgroundColor: '#10B981', elevation: 0 }]}>
              <Text style={styles.buttonText}>Tugas Selesai ✓</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  map: {
    ...StyleSheet.absoluteFill as object,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 20,
  },
  topRightContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  geofenceLabelBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginRight: 6,
  },
  geofenceBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  markerContainer: {
    position: 'absolute',
    top: '44%',
    left: '50%',
    marginLeft: -90,
    marginTop: -90,
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofenceCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    position: 'absolute',
  },
  pinContainer: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  floatingBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 4,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  eventInfo: {
    marginLeft: 12,
    flex: 1,
  },
  eventVenue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 16,
  },
  eventName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  eventAddress: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionButton: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  }
});
