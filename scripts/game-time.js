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
