import { en_US } from './en_US_messages';
import { zh_TW } from './zh_TW_messages';

const locale = {
  'en_us': en_US,
  'zh_tw': zh_TW
};

let i18n_val = {};

export function i18n(str) {
  if (i18n_val[str]) {
    return i18n_val[str].message;
  } else {
    console.log('missing i18n '+str);
  }
}

export function setupI18n(callback) {
  i18n_val = locale[getLang()];
}

export function getLang() {
  let lang = navigator.language || navigator.userLanguage || 'en_us';
  return lang.toLowerCase().replace('-', '_');
}
