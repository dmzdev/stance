// http://www.datejs.com/ - Datejs is an open-source JavaScript Date Library.
 require ("date");

var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , objectType: require("dmz/runtime/objectType")
       , const: require("const")
       }
    // Constants
    , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , TimeFactorMin = self.config.number("time-factor.min", 1)
    , TimeFactorMax = self.config.number("time-factor.max", 20)
    , RealTimeStart = self.config.number("real-time.start", 18)
    , RealTimeEnd = self.config.number("real-time.end", 6)
    // Variables
    , _gameHandle = 0
    , _serverTime = new Date()
    , _gameStartTime = new Date(2000,1)
    , _gameEndTime = new Date(2019,1)
    , _gameTimeFactor = 1.5
    , _gameTime
    , _hyperTimeStart
    , _hyperTimeEnd
    // Fuctions
    , _updateGameActive
    , _updateGameTime
    , _playInRealTime
    ;


_updateGameActive = function (time) {

   var active = _serverTime.between(_gameStartTime, _gameEndTime);

   if (_gameHandle) {

      dmz.object.flag(_gameHandle, dmz.const.ActiveHandle, active);
   }

   return active;
}


_updateGameTime = function () {

   if (_playInRealTime()) {

      _gameTime = _serverTime;
   }
   else {

      self.log.error("HYPER TIME");
      _gameTime = _serverTime;

      //_gameTime = _calcGameTime (_serverTime);
   }

   dmz.time.setFrameTime(_gameTime.getTime() / 1000);

self.log.debug("_updateGameTime: " + _gameTime);
}


_playInRealTime = function () {

   var result = true;

   if (_gameTimeFactor != 1) {

      _hyperTimeStart = new Date(_serverTime).clearTime().addHours(RealTimeEnd);
      _hyperTimeEnd = new Date(_serverTime).clearTime().addHours (RealTimeStart);

      if (_serverTime.between (_hyperTimeStart, _hyperTimeEnd)) {

         result = false;

         // always run realtime on weekends, sat=6, sun=0
         if ((_serverTime.getDay () === 6) || (_serverTime.getDay () === 0)) {

            result = true;
         }
      }
   }

   return result;
}


LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      _serverTime = new Date (data.number(TimeStampAttr) * 1000);
self.log.debug("_serverTime: " + _serverTime);

      _updateGameActive();
      _updateGameTime();
   }
});


dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.const.GameType)) {

      if (!_gameHandle) {

         _gameHandle = handle;
         _updateGameActive();
      }
   }
});


dmz.object.timeStamp.observe(self, dmz.const.GameStartTimeHandle,
function (handle, attr, value) {

   if (handle === _gameHandle) {

      _gameStartTime = new Date(value * 1000);
self.log.warn("Game START time: " + _gameStartTime);
      _updateGameActive();
   }
});


dmz.object.timeStamp.observe(self, dmz.const.GameEndTimeHandle,
function (handle, attr, value) {

   if (handle === _gameHandle) {

      _gameEndTime = value = new Date(value * 1000);
self.log.warn("Game END time: " + _gameEndTime);
      _updateGameActive();
   }
});


dmz.object.scalar.observe(self, dmz.const.GameTimeFactorHandle,
function (handle, attr, value) {

   if (handle === _gameHandle) {

      _gameTimeFactor = value;

      if (_gameTimeFactor < TimeFactorMin) { _gameTimeFactor = TimeFactorMin; }
      else if (_gameTimeFactor > TimeFactorMax) { _gameTimeFactore = TimeFactorMax; }

      dmz.time.setTimeFactor (_gameTimeFactor);

self.log.warn("GameTimeFactor: " + _gameTimeFactor);
      _updateGameTime();
   }
});


(function () {
   _updateGameTime();
}());
