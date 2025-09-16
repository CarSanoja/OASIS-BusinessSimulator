import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esSimulation from './locales/es/simulation.json';
import esFeedback from './locales/es/feedback.json';
import esProgress from './locales/es/progress.json';
import esCreator from './locales/es/creator.json';
import esMetrics from './locales/es/metrics.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enSimulation from './locales/en/simulation.json';
import enFeedback from './locales/en/feedback.json';
import enProgress from './locales/en/progress.json';
import enCreator from './locales/en/creator.json';
import enMetrics from './locales/en/metrics.json';

const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    simulation: esSimulation,
    feedback: esFeedback,
    progress: esProgress,
    creator: esCreator,
    metrics: esMetrics
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    simulation: enSimulation,
    feedback: enFeedback,
    progress: enProgress,
    creator: enCreator,
    metrics: enMetrics
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'simulation', 'feedback', 'progress', 'creator', 'metrics'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'oasisLanguage',
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;