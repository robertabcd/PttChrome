export const PREFS_CATEGORIES = ['mouseBrowsing', 'appearance'];
export const PREFS_NAV = ['general', 'about'];
export const DEFAULT_PREFS = {

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

export const PREF_OPTIONS = {
  mouseLeftFunction : [ 'options_none', 'options_enterKey', 'options_rightKey' ],
  mouseMiddleFunction : [ 'options_none', 'options_enterKey', 'options_leftKey', 'options_doPaste' ],
  mouseWheelFunction1 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
  mouseWheelFunction2 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
  mouseWheelFunction3 : [ 'options_none', 'options_upDown' , 'options_pageUpDown', 'options_threadLastNext' ],
};

export const QUICK_SEARCH = {
  providers: [
    {
      name: 'goo.gl',
      url: 'https://goo.gl/%s'
    }
  ]
};

export const PREF_STORAGE_KEY = 'pttchrome.pref.v1';
