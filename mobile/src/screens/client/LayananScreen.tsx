import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getAssetUrl } from '../../services/api';
import { EmptyState, FndHeader } from '../../components/FndUi';
import { buildServicesFromEquipment, formatCurrency, serviceCategories, ServiceItem } from '../../utils/fnd';

export const LayananScreen = ({ navigation }: any) => {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const fetchServices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/equipment');
      setServices(buildServicesFromEquipment(response.data?.data || []));
    } catch {
      setServices(buildServicesFromEquipment([]));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices(true);
    setRefreshing(false);
  };

  const categories = useMemo(() => {
    const fromServices = Array.from(new Set(services.map((service) => service.category)));
    return serviceCategories.filter((category) => category === 'Semua' || fromServices.includes(category));
  }, [services]);

  const filtered = services.filter((service) => {
    const matchCategory = activeCategory === 'Semua' || service.category === activeCategory;
    const matchSearch = service.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const selectService = (service: ServiceItem) => {
    navigation.getParent()?.navigate('Booking', {
      screen: 'BookingHome',
      params: { selectedService: service },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <FndHeader title="Layanan Kami" onBack={() => navigation.goBack()} rightIcon="search-outline" onRightPress={() => setShowSearch(!showSearch)} />

      {showSearch ? (
        <View className="px-5 pb-3">
          <View className="flex-row items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              className="ml-2 flex-1 text-sm text-primary"
              placeholder="Cari layanan..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <View className="flex-1">
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 px-5">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  className={`mr-2 rounded-full px-5 py-2.5 ${activeCategory === category ? 'bg-primary' : 'bg-slate-100'}`}
                >
                  <Text className={`text-xs font-bold ${activeCategory === category ? 'text-white' : 'text-primary'}`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            className="flex-1 px-5"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 104 }}
          >
            {filtered.length === 0 ? (
              <EmptyState icon="construct-outline" title="Layanan tidak ditemukan" />
            ) : (
              filtered.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  className="mb-4 flex-row rounded-[24px] border border-slate-100 bg-white p-3"
                  style={{ elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                  onPress={() => selectService(service)}
                >
                  <Image source={{ uri: getAssetUrl(service.image) || service.image }} className="mr-4 h-24 w-24 rounded-2xl" resizeMode="cover" />
                  <View className="flex-1 justify-center py-1">
                    <Text className="text-base font-black text-primary" numberOfLines={1}>{service.name}</Text>
                    <Text className="mt-1 text-xs leading-4 text-slate-500" numberOfLines={2}>{service.description}</Text>
                    <View className="mt-auto pt-2">
                      <Text className="text-[10px] font-bold text-slate-400">Mulai dari</Text>
                      <Text className="text-sm font-black text-accent">{formatCurrency(service.price)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
