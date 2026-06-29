import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import { Toast } from '../../components/PremiumToast';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FndHeader } from '../../components/FndUi';

const ALL_SKILLS = [
  'Sound System', 'Mixing', 'Audio Recording', 'Live Sound',
  'Lighting Design', 'Moving Head', 'LED Operation', 'DMX Programming',
  'Stage Setup', 'Rigging', 'Trussing', 'Power Distribution',
  'Video Production', 'Live Streaming', 'Camera Operation', 'Switcher',
  'MC / Host', 'Event Coordination', 'Pyrotechnics', 'SFX',
];

export const KeahlianScreen = ({ navigation }: any) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('fnd-skills').then((saved) => {
      if (saved) {
        try {
          setSelectedSkills(JSON.parse(saved));
        } catch {}
      } else {
        setSelectedSkills(['Sound System', 'Mixing', 'Audio Recording']);
      }
    });
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('fnd-skills', JSON.stringify(selectedSkills));
      Toast.show({ title: 'Berhasil', message: 'Keahlian berhasil disimpan.', type: 'success' });
    } catch {
      Toast.show({ title: 'Error', message: 'Gagal menyimpan keahlian.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FndHeader title="Keahlian" dark onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104 }}>
        <View className="mx-5 mt-5">
          <Text className="mb-1 font-bold text-primary">Pilih Keahlian Anda</Text>
          <Text className="mb-5 text-xs text-slate-400">Keahlian yang dipilih akan ditampilkan di profil Anda</Text>

          <View className="flex-row flex-wrap">
            {ALL_SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`mb-2 mr-2 flex-row items-center rounded-full px-4 py-2.5 ${isSelected ? 'bg-primary' : 'border border-slate-200 bg-white'}`}
                  style={isSelected ? {} : { elevation: 1, shadowColor: '#0D1B5E', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
                >
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                  <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-primary'}`}>{skill}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mx-5 mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Text className="text-xs font-bold text-primary">Keahlian dipilih: {selectedSkills.length}</Text>
          <Text className="mt-1 text-xs text-slate-500">{selectedSkills.join(', ') || 'Belum ada keahlian dipilih'}</Text>
        </View>

        <View className="mx-5 mt-5">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`items-center rounded-xl bg-primary py-4 ${saving ? 'opacity-70' : ''}`}
          >
            <Text className="font-bold text-white">{saving ? 'Menyimpan...' : 'Simpan Keahlian'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
