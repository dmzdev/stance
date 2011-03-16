require ("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , objectType: require("dmz/runtime/objectType")
       , const: require("const")
       }
    , Time = require("datejs/time")
    // Constants
    , RealTimeStart = self.config.number("real-time.start", 18)
    , RealTimeEnd = self.config.number("real-time.end", 6)
    // Variables
    , _game = {}
    , _gameActive = false
    , _gameTimeFactor = 1
    , _gameTime = false
    , _serverTime
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

_toTimeStamp = function (date) { return (date.valueOf() / 1000); }
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


var _setGameTime = function (index, data) {

}


var _getRealTime = function (index) {

   var rt = {}
     , data
     ;

   if (_game.handle) {

      data = dmz.object.data(_game.handle, dmz.const.GameTimeHandle);

      rt.index = index || data.number("index");
      self.log.warn(  "rt.index: " + rt.index);
      rt.current = _toDate(data.number("real_time", rt.index));
      self.log.warn("rt.current: " + rt.current);
      rt.next = _toDate(data.number("real_time", rt.index + 1));
      self.log.warn(   "rt.next: " + rt.next);
   }

   return rt;
}


var _getCurrentAndNext = function (index, func) {

   var data
     , current
     , next
     , realTime
     ;

   if (_game.handle) {

      data = dmz.object.data(_game.handle, dmz.const.GameTimeHandle);

      if (typeof index == 'function') {

         func = index;
         index = data.number("index");
      }

      self.log.warn(  "index: " + index);

      current = _toDate(data.number("real_time", index));
      next = _toDate(data.number("real_time", index+1));

      self.log.warn("current: " + current);
      self.log.warn("   next: " + next);

      var tp = new Time.TimePeriod (current, next);
      self.log.warn("m: " + tp.getMonths());
      self.log.warn("d: " + tp.getDays());
      self.log.warn("h: " + tp.getHours());
      self.log.warn("m: " + tp.getMinutes());

      if (next == "Invalid Date") {

         self.log.error("No Next Date");
      }

      if (_serverTime.between(current, next)) {

         self.log.error("Between");
         func (current, next);
      }
      else if (_serverTime.isBefore(current)) {

         self.log.error("Before");
         func (current, next);
      }
      else if (_serverTime.isAfter(current)) {

         self.log.error("After");
         _getCurrentAndNext (index+1, func);
      }
   }

//   return realTime;
}

var _calculateGameTime = function (startTime, endTime) {

   self.log.warn("start: " + startTime);
   self.log.warn("  end: " + endTime);

   var span = new Time.TimePeriod (startTime, endTime);

   self.log.warn("m: " + span.getMonths());
   self.log.warn("d: " + span.getDays());
   self.log.warn("h: " + span.getHours());
   self.log.warn("m: " + span.getMinutes());


}


dmz.object.timeStamp.observe(self, dmz.const.ServerTimeHandle,
function (handle, attr, value) {

   var serverTime
     , data
     , index
     , rt = {}
     , gt = {}
     ;

   if ((handle === _game.handle) && _game.active) {

      _serverTime = _toDate(value);
      self.log.warn("serverTime: " + _serverTime);

      _getCurrentAndNext (_calculateGameTime);

//      _getCurrentAndNext (function (current, next) {

//         self.log.warn("REAL TIME: " + current);
//         self.log.warn("REAL TIME: " + next);
//      });

//      if (serverTime.)
////      startTime = _game.startedAt();
//      data = dmz.object.data(_game.handle, dmz.const.GameTimeHandle);

//      index = data.number("index");
//self.log.warn("index:" + index);

//      rt.current = _toDate(data.number("real_time", index));
//      rt.next = _toDate(data.number("real_time", index + 1));

//      gt.current = _toDate(data.number("game_time", index));
//      gt.next = _toDate(data.number("game_time", index + 1));

//      if (serverTime.between (rt.current, rt.next)) {

//         self.log.error("Between");
//      }
//      else if (serverTime.isBefore(rt.current)) {

//         self.log.error("Before");
//      }
//      else {

//         self.log.error("After");
//      }

//      dmz.object.timeStamp(_game.handle, dmz.const.GameTimeHandle, value);
//      self.log.error("_serverTime: " + _serverTime);
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
