require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , module: require("dmz/runtime/module")
       , util: require("dmz/types/util")
       , stance: require("stanceConst")
       }
    , DateJs = require("datejs/time")
    // Constants
    , GameStartTime = dmz.stance.GameStartTimeHandle
    // Variable
    , _exports = {}
    , _game = {}
    , _server = {}
    // Fuctions
    , toDate = dmz.util.timeStampToDate
    , toTimeStamp = dmz.util.dateToTimeStamp
    , _calculateGameTime
    ;

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.stance.GameType)) {

      if (!_game.handle) { _game.handle = handle; }
   }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value) {

   if (handle === _game.handle) { _game.active = value; }
});

dmz.object.data.observe(self, GameStartTime, function (handle, attr, value) {

   if (handle === _game.handle) {

      _server.start = toDate(value.number("server", 0));
      _game.start = toDate(value.number("game", 0));
      _game.factor = value.number("factor", 0);
   }
});

_calculateGameTime = function (today) {

   var time = _game.start.clone()
     , span = new DateJs.TimeSpan(today - _server.start)
     ;

   self.log.warn("_calculateGameTime: " + today);
   self.log.warn("span: " + span.getDays() + " days");

   time.addDays(span.getDays() * _game.factor);

   time.set(
      { millisecond: today.getMilliseconds()
      , second: today.getSeconds()
      , minute: today.getMinutes()
      , hour: today.getHours()
      }
   );

   self.log.warn("time: " + time);

   dmz.time.setFrameTime(toTimeStamp(time));
};

//dmz.object.timeStamp.observe(self, dmz.stance.ServerTimeHandle,
//function (handle, attr, value) {

//   if ((handle === _game.handle) && _game.active) {

//      self.log.warn("serverTime: " + value);
//   }
//});

//dmz.object.timeStamp.observe(self, dmz.stance.GameTimeHandle,
//function (handle, attr, value) {

//   if (handle === _game.handle) {

//      dmz.time.setFrameTime(value);
//self.log.warn("gameTime: " + dmz.util.timeStampToDate(value));
//   }
//});

//dmz.object.scalar.observe(self, dmz.stance.GameTimeFactorHandle,
//function (handle, attr, value) {

//   if (handle === _game.handle) {

//      dmz.time.setTimeFactor(value);
//self.log.warn("gameTimeFactor: " + value);
//   }
//});

//_updateGameTimeStamps = function () {

//   var local = _exports.localTime()
//     , server = _exports.serverTime()
//     , game = _exports.gameTime()
//     , delta = server - local;
//     ;

//   if (_game.handle) {

//      if (Math.abs(delta) < 0.1) { delta = 0.0; }

//      dmz.object.counter(_game.handle, "local_time_delta", delta);
//      dmz.object.timeStamp(_game.handle, dmz.stance.LocalTimeHandle, local);
//      dmz.object.timeStamp(_game.handle, dmz.stance.ServerTimeHandle, server);
//      dmz.object.timeStamp(_game.handle, dmz.stance.GameTimeHandle, game);
//   }
//};

//dmz.time.setRepeatingTimer (self, UpdateInterval, _updateGameTimeStamps);

_exports.localTime = function () {

   return new Date();
};

_exports.gameTime = function () {

   return toDate(dmz.time.getFrameTime());
};

_exports.serverTime = function () {

   return dmz.time.getFrameTime();
};

_exports.setServerTime = function (timeStamp) {

   var today
     , time
     , span
     ;

   if (timeStamp) {

      if (timeStamp instanceof Date) {

         today = timeStamp;
         timeStamp = toTimeStamp(today);
      }
      else { today = toDate(timeStamp); }

      if (_game.active) {

         time = _game.start.clone();
         span = new DateJs.TimeSpan(today - _server.start);

         time.addDays(span.getDays() * _game.factor);

         time.set(
            { millisecond: today.getMilliseconds()
            , second: today.getSeconds()
            , minute: today.getMinutes()
            , hour: today.getHours()
            }
         );

         self.log.info("Real Time: " + today);
         self.log.info("Game Time: " + time);

         timeStamp = toTimeStamp(time);
      }

      dmz.time.setFrameTime(timeStamp);
   }
};

// Publish module
dmz.module.publish(self, _exports);

