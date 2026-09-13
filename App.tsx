import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense, useState } from 'react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { AppLoadingScreen } from './src/components/AppLoadingScreen';
import type { AppSection } from './src/components/FloatingNavigation';
import { migrateDatabase } from './src/database/migrations';
import { TodayScreen } from './src/screens/TodayScreen';
import { TrainScreen } from './src/screens/TrainScreen';
import { useAppTheme } from './src/theme/useAppTheme';

function AppContent() {
  const theme = useAppTheme();
  const [activeSection, setActiveSection] = useState<AppSection>('today');

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {activeSection === 'today' ? (
        <TodayScreen onNavigate={setActiveSection} />
      ) : (
        <TrainScreen onNavigate={setActiveSection} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Suspense fallback={<AppLoadingScreen />}>
        <SQLiteProvider
          databaseName="fitflow.db"
          onInit={migrateDatabase}
          useSuspense
        >
          <AppContent />
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
