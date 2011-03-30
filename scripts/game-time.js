require ("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , objectType: require("dmz/runtime/objectType")
       , util: require("dmz/types/util")
       , stance: require("stanceConst")
       }
    , DateJs = require("datejs/time")
    // Constants
    , OneHour = 3600000
    , RealTimeAttr = dmz.defs.createNamedHandle("real_time")
    , GameTimeAttr = dmz.defs.createNamedHandle("game_time")
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
    , _setServerTime
    , _setUser
    , _updateGameActive
    , _updateGameTime
    , _playInRealTime
    ;


_game.startedAt = function () {

   var result;

   if (this.handle) {

      result = dmz.object.timeStamp (this.handle, dmz.stance.GameStartTimeHandle);
      result = new Date(result * 1000);
   }

   return result;
}


_setServerTime = function (time) {

   var timeStamp = time;

   if (typeof time === "object") { timeStamp = dmz.util.dateToTimeStamp(time); }

   if (_game.handle) {

      dmz.object.timeStamp(_game.handle, dmz.stance.ServerTimeHandle, timeStamp);
   }
   else  { _serverTime = dmz.util.timeStampToDate(timeStamp); }
}


_setUser = function (name) {

   if (_game.handle && name) {

      dmz.object.text(_game.handle, dmz.stance.UserNameHandle, name);
   }
   else { _user = name; }
}


_updateGameActive = function (time) {

   var active = _serverTime.between(_gameStartTime, _gameEndTime);

   if (_game.handle) {

//      dmz.object.flag(_game.handle, dmz.stance.ActiveHandle, active);
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

   dmz.time.setFrameTime(dmz.util.dateToTimeStamp(_gameTime));

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

   if (type.isOfType(dmz.stance.GameType)) {

      if (!_game.handle) { _game.handle = handle; }
   }
});


dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value) {

   if (handle === _game.handle) { _game.active = value; }
});


var _setGameTime = function (index, data) {

}


var _getRealTime = function (index) {

   var rt = {}
     , data
     ;

   if (_game.handle) {

      data = dmz.object.data(_game.handle, dmz.stance.GameTimeHandle);

      rt.index = index || data.number("index");
      self.log.warn(  "rt.index: " + rt.index);
      rt.current = dmz.util.timeStampToDate(data.number(RealTimeAttr, rt.index));
      self.log.warn("rt.current: " + rt.current);
      rt.next = dmz.util.timeStampToDate(data.number(RealTimeAttr, rt.index + 1));
      self.log.warn(   "rt.next: " + rt.next);
   }

   return rt;
}


var _getCurrentAndNext = function (index, func) {

   var data
     , realTime = {}
     , gameTime = {}
     , current
     , next
     , realTime
     ;

   if (_game.handle) {

      data = dmz.object.data(_game.handle, dmz.stance.GameTimeHandle);

      if (typeof index == 'function') {

         func = index;
         index = data.number("index");
      }

      self.log.warn(  "index: " + index);

      realTime.current = dmz.util.timeStampToDate(data.number(RealTimeAttr, index));
      realTime.next = dmz.util.timeStampToDate(data.number(RealTimeAttr, index+1));

      gameTime.current = dmz.util.timeStampToDate(data.number(GameTimeAttr, index));
      gameTime.next = dmz.util.timeStampToDate(data.number(GameTimeAttr, index+1));

//      self.log.warn("current: " + current);
//      self.log.warn("   next: " + next);

//      var tp = new DateJs.TimePeriod (current, next);
//      self.log.warn("m: " + tp.getMonths());
//      self.log.warn("d: " + tp.getDays());
//      self.log.warn("h: " + tp.getHours());
//      self.log.warn("m: " + tp.getMinutes());

      if (next == "Invalid Date") {

         self.log.error("No Next Date");
      }

      if (_serverTime.between(realTime.current, realTime.next)) {

         self.log.error("Between");
         func (realTime, gameTime);
      }
      else if (_serverTime.isBefore(current)) {

         self.log.error("Before");
         func (realTime, gameTime);
      }
      else if (_serverTime.isAfter(current)) {

         self.log.error("After");
         _getCurrentAndNext (index+1, func);
      }
   }

//   return realTime;
}

var _calculateGameTime = function (realTime, gameTime) {

   self.log.warn("start: " + realTime.current);
   self.log.warn("  end: " + realTime.next);

   var rtDelta = realTime.next - realTime.current
     , gtDelta = gameTime.next - gameTime.current
     , rtSpan = new DateJs.TimeSpan (rtDelta)
     , gtSpan = new DateJs.TimeSpan (gtDelta)
     , timeFactor
     , startTime
     , deltaTime
     , theTime
     ;

   self.log.info("rtDelta: " + rtDelta);
   self.log.info("hours: " + (rtDelta / OneHour));

   self.log.info("RealTime Span: " + rtSpan.getTotalMilliseconds());
//   self.log.warn("m: " + rtSpan.getMonths());
//   self.log.warn("d: " + rtSpan.getDays());
//   self.log.warn("h: " + rtSpan.getHours());
//   self.log.warn("m: " + rtSpan.getMinutes());

   self.log.info("gtDelta: " + gtDelta);
   self.log.info("hours: " + (gtDelta / OneHour));

   self.log.info("GameTime Span: " + gtSpan);
//   self.log.warn("m: " + rtSpan.getMonths());
//   self.log.warn("d: " + rtSpan.getDays());
//   self.log.warn("h: " + rtSpan.getHours());
//   self.log.warn("m: " + rtSpan.getMinutes());

   timeFactor = (rtDelta / OneHour)
}


dmz.object.timeStamp.observe(self, dmz.stance.ServerTimeHandle,
function (handle, attr, value) {

   var serverTime
     , data
     , index
     , rt = {}
     , gt = {}
     ;

   if ((handle === _game.handle) && _game.active) {

      _serverTime = dmz.util.timeStampToDate(value);
      self.log.warn("serverTime: " + _serverTime);

//      _getCurrentAndNext (_calculateGameTime);

//      _getCurrentAndNext (function (current, next) {

//         self.log.warn("REAL TIME: " + current);
//         self.log.warn("REAL TIME: " + next);
//      });

//      if (serverTime.)
////      startTime = _game.startedAt();
//      data = dmz.object.data(_game.handle, dmz.stance.GameTimeHandle);

//      index = data.number("index");
//self.log.warn("index:" + index);


//      if (serverTime.between (rt.current, rt.next)) {

//         self.log.error("Between");
//      }
//      else if (serverTime.isBefore(rt.current)) {

//         self.log.error("Before");
//      }
//      else {

//         self.log.error("After");
//      }

//      dmz.object.timeStamp(_game.handle, dmz.stance.GameTimeHandle, value);
//      self.log.error("_serverTime: " + _serverTime);

// for now just set game time to be server time
dmz.time.setFrameTime(value);
   }
});


dmz.object.timeStamp.observe(self, dmz.stance.GameTimeHandle,
function (handle, attr, value) {

   if (handle === _game.handle) {

      dmz.time.setFrameTime(value);
self.log.warn("gameTime: " + dmz.util.timeStampToDate(value));
   }
});


dmz.object.scalar.observe(self, dmz.stance.GameTimeFactorHandle,
function (handle, attr, value) {

   if (handle === _game.handle) {

      dmz.time.setTimeFactor(value);
self.log.warn("gameTimeFactor: " + value);
   }
});


(function () {
//   _updateGameTime();
}());
