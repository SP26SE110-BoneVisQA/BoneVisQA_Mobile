import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { vi } from './vi';
import { en } from './en';

const locale = Localization.getLocales()[0]?.languageCode ?? 'vi';

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: locale.startsWith('vi') ? 'vi' : 'en',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
