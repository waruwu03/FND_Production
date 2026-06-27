import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FndHeader } from '../../components/FndUi';
import { Input } from '../../components/Input';

const BANKS = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'BSI', 'Bank Jago', 'Dana', 'OVO', 'GoPay'];

export const RekeningScreen = ({ navigation }: any) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('fnd-rekening').then((saved) => {
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setBankName(data.bankName || '');
          setAccountNumber(data.accountNumber || '');
          setAccountHolder(data.accountHolder || '');
        } catch {}
      }
    });
  }, []);

  const handleSave = async () => {
    if (!bankName || !accountNumber || !accountHolder) {
      Alert.alert('Error', 'Semua field wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await AsyncStorage.setItem('fnd-rekening', JSON.stringify({ bankName, accountNumber, accountHolder }));
      Alert.alert('Berhasil', 'Data rekening berhasil disimpan.');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan data rekening.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FndHeader title="Rekening Pembayaran" dark onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104 }}>
        <View className="mt-5 rounded-2xl border border-slate-100 bg-white p-5" style={{ elevation: 2, shadowColor: '#0D1B5E', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Ionicons name="card-outline" size={20} color="#059669" />
            </View>
            <View>
              <Text className="font-bold text-primary">Informasi Rekening</Text>
              <Text className="mt-0.5 text-xs text-slate-400">Data untuk penerimaan pembayaran</Text>
            </View>
          </View>

          {/* Bank Picker */}
          <View className="mb-4">
            <Text className="mb-2 font-semibold text-[#1E293B]">Nama Bank</Text>
            <TouchableOpacity
              onPress={() => setShowBankPicker(!showBankPicker)}
              className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="business-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <Text className={bankName ? 'text-[#0D1B5E]' : 'text-slate-400'}>{bankName || 'Pilih bank'}</Text>
              </View>
              <Ionicons name={showBankPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </TouchableOpacity>

            {showBankPicker && (
              <View className="mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white" style={{ elevation: 5 }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      className={`px-4 py-3 ${bank === bankName ? 'bg-blue-50' : ''}`}
                      onPress={() => { setBankName(bank); setShowBankPicker(false); }}
                    >
                      <Text className={`font-semibold ${bank === bankName ? 'text-accent' : 'text-primary'}`}>{bank}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Input
            variant="light"
            label="Nomor Rekening"
            placeholder="Masukkan nomor rekening"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            icon="card-outline"
          />

          <Input
            variant="light"
            label="Nama Pemilik Rekening"
            placeholder="Nama sesuai buku tabungan"
            value={accountHolder}
            onChangeText={setAccountHolder}
            icon="person-outline"
          />
        </View>

        {/* Preview */}
        {bankName && accountNumber && (
          <View className="mx-0 mt-4 rounded-2xl bg-primary p-5">
            <Text className="text-xs font-semibold text-slate-300">Rekening Aktif</Text>
            <Text className="mt-2 text-lg font-black text-white">{bankName}</Text>
            <Text className="mt-1 text-sm text-white/70">{accountNumber}</Text>
            <Text className="mt-1 text-xs text-white/50">a.n. {accountHolder || '-'}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`mt-5 items-center rounded-xl bg-primary py-4 ${saving ? 'opacity-70' : ''}`}
        >
          <Text className="font-bold text-white">{saving ? 'Menyimpan...' : 'Simpan Rekening'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
