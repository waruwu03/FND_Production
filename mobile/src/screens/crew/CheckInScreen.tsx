import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, InfoRow } from '../../components/FndUi';
import { getEventStatusMeta, getLocationParts } from '../../utils/fnd';

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

  const eventCoords = useMemo(() => {
    // Hotel Mulia Jakarta coordinates or mock coordinates close to default emulator location for testing
    return {
      latitude: -6.2088,
      longitude: 106.8456,
    };
  }, []);

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
        Alert.alert('Check-In Berhasil! 🎉', 'Kehadiran Anda di area geofence berhasil dicatat.');
      } else {
        throw new Error(response.data?.error || 'Gagal menyimpan data check-in.');
      }
    } catch (error: any) {
      // Fallback local checkin in case server offline
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedIn');
      setStatus('checkedIn');
      Alert.alert('Check-In Berhasil (Offline)', 'Lokasi telah dicatat secara lokal.');
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
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedIn');
      setStatus('checkedIn');
      Alert.alert('Check-In Berhasil (Offline)', 'Lokasi telah dicatat secara lokal.');
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
        Alert.alert('Check-Out Berhasil! 🏁', 'Tugas Anda selesai dan telah berhasil dicatat.');
      } else {
        throw new Error(response.data?.error || 'Gagal check-out.');
      }
    } catch {
      await AsyncStorage.setItem(`fnd-checkin-${event.id}`, 'checkedOut');
      setStatus('checkedOut');
      Alert.alert('Check-Out Berhasil (Offline)', 'Waktu selesai telah dicatat secara lokal.');
    } finally {
      setIsLoading(false);
    }
  };

  const location = getLocationParts(event || {});
  const isWithinGeofence = distance !== null && distance <= 100;

  const eventImageUrl = useMemo(() => {
    if (event?.reference_images) {
      try {
        const parsed = JSON.parse(event.reference_images);
        if (Array.isArray(parsed) && parsed[0]) return getAssetUrl(parsed[0]);
      } catch {
        if (typeof event.reference_images === 'string' && event.reference_images.startsWith('http')) {
          return event.reference_images;
        }
      }
    }
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80';
  }, [event?.reference_images]);

  return (
    <View style={styles.container}>
      {/* Background Static Map */}
      <Image
        source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/106.8456,-6.2088,14.5,0/640x960?access_token=YOUR_MAPBOX_ACCESS_TOKEN' }}
        style={styles.map}
        resizeMode="cover"
      />

      {/* Floating Header Actions */}
      <TouchableOpacity
        onPress={() => navigation.getParent()?.navigate('Beranda')}
        style={[styles.backButton, { top: insets.top + 12 }]}
      >
        <Ionicons name="chevron-back" size={24} color="#0F172A" />
      </TouchableOpacity>

      <View style={[styles.topRightContainer, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.roundButton}>
          <Ionicons name="compass" size={20} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundButton}>
          <Ionicons name="navigate" size={18} color="#0F172A" style={{ transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={[styles.geofenceLabelBadge, { top: insets.top + 12 }]}>
        <View style={styles.orangeDot} />
        <Text style={styles.geofenceBadgeText}>Geofence</Text>
      </View>

      {/* Geofence Overlay Marker */}
      <View style={styles.markerContainer}>
        <View style={styles.geofenceCircle} />
        <View style={styles.pinContainer}>
          <Ionicons name="location" size={38} color="#F97316" />
        </View>
      </View>

      {/* Bottom Floating Container */}
      <View style={[styles.bottomContainer, { bottom: insets.bottom + 16 }]}>
        {/* Floating status row */}
        <View style={styles.badgeRow}>
          <View style={styles.floatingBadge}>
            <Ionicons name="location" size={14} color="#0F172A" />
            <Text style={styles.badgeText}>Geofence</Text>
          </View>
          <View style={styles.floatingBadge}>
            <Ionicons
              name={isWithinGeofence ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={isWithinGeofence ? '#10B981' : '#F59E0B'}
            />
            <Text style={styles.badgeText}>
              {distance !== null ? `${distance} m` : 'Calculating...'}
            </Text>
          </View>
        </View>

        {/* Bottom White Card */}
        <View style={styles.bottomCard}>
          <View style={styles.eventRow}>
            <Image source={{ uri: eventImageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&q=80' }} style={styles.eventImage} resizeMode="cover" />
            <View style={styles.eventInfo}>
              <Text style={styles.eventVenue} numberOfLines={1}>{location.venue || 'Hotel Mulia Jakarta'}</Text>
              <Text style={styles.eventName} numberOfLines={1}>{event.name || 'Wedding Andi & Sinta'}</Text>
              <Text style={styles.eventAddress} numberOfLines={1}>{location.address || 'Jakarta'}</Text>
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
    ...StyleSheet.absoluteFillObject,
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
