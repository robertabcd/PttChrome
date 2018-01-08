import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { getQueryVariable } from './util';
import { readValuesWithDefault } from '../components/ContextMenu/PrefModal';

function startApp() {
  var site = getQueryVariable('site');
  var from = getQueryVariable('from');
  var keepAlive = getQueryVariable('keepAlive');
  setupI18n();

  const app = new App({ from: from, keepAlive: keepAlive });

  (process.env.DEVELOPER_MODE ? import('../components/DeveloperModeAlert')
    .then(({DeveloperModeAlert}) => new Promise((resolve, reject) => {
      const container = document.getElementById('reactAlert')
      const onDismiss = () => {
        ReactDOM.unmountComponentAtNode(container)
        resolve()
      }
      ReactDOM.render(
        <DeveloperModeAlert onDismiss={onDismiss} />,
        container
      )
    })) : Promise.resolve()
  ).then(() => {
    // connect.
    app.connect(getQueryVariable('site') || process.env.DEFAULT_SITE);
    // TODO: Call onSymFont for font data when it's implemented.
    console.log("load pref from storage");
    app.onValuesPrefChange(readValuesWithDefault());
    app.setInputAreaFocus();
    $('#BBSWindow').show();
    //$('#sideMenus').show();
    app.onWindowResize();
  })
}

function loadTable(url) {
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: url,
      processData: false,
      xhrFields: {
        responseType: 'arraybuffer'
      }
    }).done(function(data) {
      resolve(data);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.log('loadTable failed: ' + textStatus + ': ' + url);
      reject();
    });
  });
}

function loadResources() {
  Promise.all([
    loadTable(require('../conv/b2u_table.bin')),
    loadTable(require('../conv/u2b_table.bin'))
  ]).then(function(binData) {
    window.lib = window.lib || {};
    window.lib.b2uArray = new Uint8Array(binData[0]);
    window.lib.u2bArray = new Uint8Array(binData[1]);
    $(document).ready(startApp);
  }, function() {
    console.log('loadResources failed');
  });
}

loadResources();
