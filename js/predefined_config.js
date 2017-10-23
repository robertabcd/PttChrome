var PREFS_CATEGORIES = ['mouseBrowsing', 'appearance'];
var PREFS_NAV = ['general', 'about'];
var DEFAULT_PREFS = {

  // general
  //dbcsDetect    : false,
  enablePicPreview      : true,
  enableNotifications   : true,
  enableEasyReading     : false,
  endTurnsOnLiveUpdate  : false,
  copyOnSelect          : false,
  antiIdleTime          : 0,
  lineWrap              : 78,

  // mouse browsing
  useMouseBrowsing            : false,
  mouseBrowsingHighlight      : true,
  mouseBrowsingHighlightColor : 2,
  mouseLeftFunction           : 0,
  mouseMiddleFunction         : 0,
  mouseWheelFunction1         : 1,
  mouseWheelFunction2         : 2,
  mouseWheelFunction3         : 3,

  // displays
  fontFitWindowWidth: false,
  fontFace          : 'MingLiu,SymMingLiU,monospace',
  bbsMargin         : 0
};

var PREF_OPTIONS = {
  mouseLeftFunction : [ 'options_none', 'options_enterKey', 'options_rightKey' ],
  mouseMiddleFunction : [ 'options_none', 'options_enterKey', 'options_leftKey', 'options_doPaste' ],
  mouseWheelFunction1 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
  mouseWheelFunction2 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
  mouseWheelFunction3 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
};

var QUICK_SEARCH = {
  providers: [
    {
      name: 'goo.gl',
      url: 'https://goo.gl/%s'
    }
  ]
};

var PREF_STORAGE_KEY = 'pttchrome.pref.v1';
