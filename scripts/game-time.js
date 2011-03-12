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
    , RealTimeStart = self.config.number("real-time.start", 18)
    , RealTimeEnd = self.config.number("real-time.end", 6)
    // Variables
    , _game = {}
    , _gameActive = false
    , _gameTimeFactor = 1
    , _gameTime = false
    , _serverTime = new Date()
    , _gameStartTime = new Date(2000,1)
    , _gameEndTime = new Date(2019,1)
    , _hyperTimeStart
    , _hyperTimeEnd
    , _user
    // Fuctions
    , _toTimeStamp
    , _toDate
    , _setServerTime
    , _setUser
    , _updateGameActive
    , _updateGameTime
    , _playInRealTime
    ;

_game.startedAt = function () {

   var result;

   if (this.handle) {

      result = dmz.object.timeStamp (this.handle, dmz.const.GameStartTimeHandle);
      result = new Date(result * 1000);
   }

   return result;
}

_toTimeStamp = function (date) { return (date.getTime() / 1000); }
_toDate = function (timeStamp) { return new Date(timeStamp * 1000); }

_setServerTime = function (time) {

   var timeStamp = time;

   if (typeof time === "object") { timeStamp = _toTimeStamp(time); }

   if (_game.handle) {

      dmz.object.timeStamp(_game.handle, dmz.const.ServerTimeHandle, timeStamp);
   }
   else  { _serverTime = _toDate(timeStamp); }
}


_setUser = function (name) {

   if (_game.handle && name) {

      dmz.object.text(_game.handle, dmz.const.UserNameHandle, name);
   }
   else { _user = name; }
}


_updateGameActive = function (time) {

   var active = _serverTime.between(_gameStartTime, _gameEndTime);

   if (_game.handle) {

//      dmz.object.flag(_game.handle, dmz.const.ActiveHandle, active);
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


dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.const.GameType)) {

      if (!_game.handle) { _game.handle = handle; }
   }
});


dmz.object.flag.observe(self, dmz.const.ActiveHandle, function (handle, attr, value) {

   if (handle === _game.handle) { _game.active = value; }
});


dmz.object.timeStamp.observe(self, dmz.const.ServerTimeHandle,
function (handle, attr, value) {

   var startTime
     , data
     , hyperTimeStart
     , hyperTimeEnd
     ;

   if ((handle === _game.handle) && _game.active) {

      startTime = _game.startedAt();
      data = dmz.object.data(_game.handle, dmz.const.GameTimeHandle);
      hyperTimeStart = data.number("real-time", 1);
      hyperTimeEnd = data.number("real-time", 0);

//      _serverTime = _toDate(value);
self.log.warn("game started at: " + _game.startedAt());

//      dmz.object.timeStamp(_game.handle, dmz.const.GameTimeHandle, value);
      self.log.error("_serverTime: " + _serverTime);
   }
});


dmz.object.timeStamp.observe(self, dmz.const.GameTimeHandle,
function (handle, attr, value) {

   if (handle === _game.handle) {

      dmz.time.setFrameTime(value);
self.log.warn("gameTime: " + _toDate(value));
   }
});


dmz.object.scalar.observe(self, dmz.const.GameTimeFactorHandle,
function (handle, attr, value) {

   if (handle === _game.handle) {

      dmz.time.setTimeFactor(value);
self.log.warn("gameTimeFactor: " + value);
   }
});


(function () {
//   _updateGameTime();
}());
