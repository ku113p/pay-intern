import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enLanding from './locales/en/landing.json';
import enCommon from './locales/en/common.json';
import ruLanding from './locales/ru/landing.json';
import ruCommon from './locales/ru/common.json';
import esLanding from './locales/es/landing.json';
import esCommon from './locales/es/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { landing: enLanding, common: enCommon },
      ru: { landing: ruLanding, common: ruCommon },
      es: { landing: esLanding, common: esCommon },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
