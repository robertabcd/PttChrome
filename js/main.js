import './constants.js';
import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { getQueryVariable } from './util';

function startApp() {
  var site = getQueryVariable('site');
  var from = getQueryVariable('from');
  var keepAlive = getQueryVariable('keepAlive');
  setupI18n();

  pttchrome.app = new App(function(app) {
    app.setInputAreaFocus();
    $('#BBSWindow').show();
    //$('#sideMenus').show();
    app.onWindowResize();
  }, { from: from, keepAlive: keepAlive });
}

function base64ToUint8Array(it) {
  return new Uint8Array([].map.call(atob(it), it => it.charCodeAt(0)))
}

function loadResources() {
  Promise.all([
    // Before (binary) 91.2 kB => After (base64) 98.4 kB
    import('../conv/b2u_table.bin'/* webpackChunkName: "binary" */).then(base64ToUint8Array),
    import('../conv/u2b_table.bin'/* webpackChunkName: "binary" */).then(base64ToUint8Array),
  ]).then(function(binData) {
    window.lib = window.lib || {};
    window.lib.b2uArray = binData[0];
    window.lib.u2bArray = binData[1];
    $(document).ready(startApp);
  }, function() {
    console.log('loadResources failed');
  });
}

loadResources();
