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

$(document).ready(startApp);
