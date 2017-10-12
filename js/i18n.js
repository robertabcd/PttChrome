import { en_US } from './en_US_messages';
import { zh_TW } from './zh_TW_messages';

var locale = {};
locale.en_US = en_US;
locale.zh_TW = zh_TW;
var i18n_val = {};
export function i18n(str) {
  if (i18n_val[str]) {
    return i18n_val[str].message;
  } else {
    console.log('missing i18n '+str);
  }
}

export function setupI18n(callback) {
  var lang = getLang();
  i18n_val = locale[lang];
}

export function getLang() {
  var lang = navigator.language || navigator.userLanguage;
  if (lang.length == 5) {
    // chrome 40+ uses lower case country code
    lang = lang.substr(0,3) + lang.substr(3,5).toUpperCase();
  }
  if (lang === '' || !(lang == 'en-US' || lang == 'zh-TW')) {
    lang = 'en-US';
  }
  lang = lang.replace('-', '_');
  return lang;
}
