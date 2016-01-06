document.addEventListener('DOMContentLoaded', function() {
  var site = getQueryVariable('site');
  var from = getQueryVariable('from');
  var keepAlive = getQueryVariable('keepAlive');
  setupI18n();
  // setup the warning message and inform to click button to install app
  setupJumbo();
  if (typeof(chrome) == 'undefined') {
    // don't seem to be using chrome, show msg
    console.log('app is not running or installed');
    document.getElementById('welcome-jumbo').style.display = 'block';
    return;
  }

  pttchrome.app = new pttchrome.App(function(app) {
    app.setInputAreaFocus();
    if (!site) {
      site = 'ptt.cc';
    }
    app.connect(site);
    document.getElementById('BBSWindow').style.display = 'block';
    app.onWindowResize();
  }, { from: from, keepAlive: keepAlive });
  // calls the gapi onload
  handleGapiClientLoad();
});

function setupJumbo() {
  var getAppBtn = document.getElementById('get-app-btn');
  if (getAppBtn) {
    getAppBtn.addEventListener('click', function() {
      if (typeof(chrome) == 'undefined') {
        window.open('https://chrome.google.com/webstore/detail/pttchrome/hhnlfapopmaimdlldbknjdgekpgffmbo', '_self');
        return;
      }
      // turn it on when it works
      chrome.webstore.install(undefined, function() {
        // successfully installed
        location.reload();
      });
      //window.open('https://chrome.google.com/webstore/detail/pttchrome/'+self.appId, '_self');
    });

    getAppBtn.textContent = i18n('getAppBtn');
  }

  for (var i = 1; i < 5; ++i) {
    document.getElementById('already-installed-hint'+i).textContent = i18n('alreadyInstalledHint'+i);
  }
}

/**
  * Called when the client library is loaded.
  */
function handleGapiClientLoad() {
  $('#blacklist_driveLoading').css('display', '');
  window.setTimeout(pttchrome.app.pref.gdrive.checkAuth.bind(pttchrome.app.pref.gdrive), 1);
}

function setTimer(repeat, func, timelimit) {
  if(repeat) {
	  return {
		  timer: setInterval(func, timelimit),
		  cancel: function() {
			  clearInterval(this.timer);
		  }
	  };
  } else {
	  return {
		  timer: setTimeout(func, timelimit),
		  cancel: function() {
			  clearTimeout(this.timer);
		  }
	  };
  }
}

function openURI(uri, activate, postData) {
  chrome.tabs.create({
      url: uri,
      selected: activate
  }, function(tab) {
  });
}
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return null;
}

