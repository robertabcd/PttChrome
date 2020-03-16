import { App } from './pttchrome';
import { setupI18n } from './i18n';
import { getQueryVariable } from './util';
import { readValuesWithDefault } from '../components/ContextMenu/PrefModal';
import b2u_table from '../conv/b2u_table.bin';
import u2b_table from '../conv/u2b_table.bin';

function startApp() {
  setupI18n();

  const app = new App();

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
    app.connect(
      process.env.ALLOW_SITE_IN_QUERY && getQueryVariable('site')
      || process.env.DEFAULT_SITE);
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
  return fetch(url).then(response => {
    if (!response.ok)
      throw new Error('loadTable failed: ' + response.statusText + ': ' + url);
    return response.arrayBuffer();
  });
}

function loadResources() {
  Promise.all([
    loadTable(b2u_table),
    loadTable(u2b_table)
  ]).then(function(binData) {
    window.lib = window.lib || {};
    window.lib.b2uArray = new Uint8Array(binData[0]);
    window.lib.u2bArray = new Uint8Array(binData[1]);
    $(document).ready(startApp);
  }, function(e) {
    console.log('loadResources failed: ' + e);
  });
}

loadResources();
