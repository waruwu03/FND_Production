import 'react-native-gesture-handler';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';

import { PremiumAlertProvider } from './src/components/PremiumAlert';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          }
          persistor={persistor}
        >
          <PremiumAlertProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </PremiumAlertProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
