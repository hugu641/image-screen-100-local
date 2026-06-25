// Shared configuration and status constants
const SCREEN_STATUS = {
  CONNECTED: 'connected',
  OFFLINE: 'offline',
  NETWORK_ERROR: 'network_error',
  WAITING_CONTENT: 'waiting_content',
  NOT_ASSOCIATED: 'not_associated'
};

const TRANSITIONS = {
  FADE: 'fade',
  ZOOM: 'zoom',
  SLIDE: 'slide'
};

const DEFAULT_SETTINGS = {
  STORE_NAME: 'Mon Magasin',
  DEFAULT_DURATION: 5, // in seconds
  SERVER_PORT: 5000
};

module.exports = {
  SCREEN_STATUS,
  TRANSITIONS,
  DEFAULT_SETTINGS
};
