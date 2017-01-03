function SecureShellConnection(socket, host, port) {
  this.host = 'ptt.cc';
  this.port = 22;
  this.keepAlive = null;

  this.login = 'bbs';
  this.password = '';

  this.privatekey = '';
  this.width = 80;
  this.height = 24;

  // internal variables
  this.transport = null;
  this.client = null;
  this.shell = null;

  this._attachConn(socket, host, port);
}

pttchrome.Event.mixin(SecureShellConnection.prototype);

SecureShellConnection.prototype._attachConn = function(socket, host, port) {
  this.isConnected = false;

  var self = this;
  var shell_success = function(shell) {
    self.shell = shell;
  };

  this.client = new paramikojs.SSHClient();
  this.client.set_missing_host_key_policy(new paramikojs.AutoAddPolicy());
  this.client.load_host_keys('known_hosts');

  var auth_success = function() {
    self.client.invoke_shell('xterm-256color', self.width, self.height, shell_success);
  };

  var write = function(str) {
    if (str) {
      self.socket.send(str);
    }
  };

  this.transport = this.client.connect(
      write, auth_success, this.host, this.port, 
      this.login, this.password, null, this.privatekey);

  this.socket = socket;
  this.socket.addEventListener('open', this._onOpen.bind(this));
  this.socket.addEventListener('data', this._onDataAvailable.bind(this));
  this.socket.addEventListener('close', this._onClose.bind(this));
};

SecureShellConnection.prototype._onOpen = function(e) {
  this.dispatchEvent(new CustomEvent('open'));
};

SecureShellConnection.prototype._onClose = function(e) {
  this.dispatchEvent(new CustomEvent('close'));
};

SecureShellConnection.prototype._onDataAvailable = function(e) {
  var str = e.detail.data;
  try {
    this.transport.fullBuffer += str;  // read data
    this.transport.run();
  } catch(ex) {
    console.log(ex);

    if (ex instanceof paramikojs.ssh_exception.AuthenticationException) {
      this.client.legitClose = true;
      return;
    }
  }

  var data = '';
  try {
    if (!this.shell) {
      return;
    }
    if (this.shell.closed) {
      this.close();
      return;
    }
    data = this.shell.recv(65536);
  } catch(ex) {
    if (ex instanceof paramikojs.ssh_exception.WaitException) {
      // some times no data comes out, dont care
      return;
    } else {
      throw ex;
    }
  }
  if (data) {
    this.dispatchEvent(new CustomEvent('data', {
      detail: {
        data: data
      }
    }));
  }
};

SecureShellConnection.prototype.close = function() {
  this.socket.close();
};

// from cli to paramikojs
SecureShellConnection.prototype.send = function(str) {
  this.shell.send(str);
};

SecureShellConnection.prototype.convSend = function(unicode_str) {
  // supports UAO
  // when converting unicode to big5, use UAO.

  var s = unicode_str.u2b();
  // detect ;50m (half color) and then convert accordingly
  if (s) {
    s = s.ansiHalfColorConv();
    this.send(s);
  }
};

// not tested
SecureShellConnection.prototype.sendNaws = function(cols, rows) {
  this.shell.resize_pty(cols, rows);
};
