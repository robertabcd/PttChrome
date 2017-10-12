import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { getQueryVariable } from './util';

function startApp() {
  var site = getQueryVariable('site');
  var from = getQueryVariable('from');
  var keepAlive = getQueryVariable('keepAlive');
  setupI18n();
  if (0 && typeof(chrome) == 'undefined') {
    // don't seem to be using chrome, show msg
    $('#getAppBtn').off();
    $('#getAppBtn').click(function() {
      window.open('https://chrome.google.com/webstore/detail/pttchrome/hhnlfapopmaimdlldbknjdgekpgffmbo', '_self');
    });
    console.log('app is not running or installed');
    $('#getAppBtn').text(i18n('getAppBtn'));
    for (var i = 1; i < 5; ++i) {
      $('#alreadyInstalledHint'+i).text(i18n('alreadyInstalledHint'+i));
    }
    $('#welcomeJumbo').show();
    return;
  }

  pttchrome.app = new App(function(app) {
    app.setInputAreaFocus();
    $('#BBSWindow').show();
    //$('#sideMenus').show();
    app.onWindowResize();
  }, { from: from, keepAlive: keepAlive });
}

$(document).ready(startApp);
