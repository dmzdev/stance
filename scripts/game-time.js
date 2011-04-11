require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
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

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle, function (handle, attr, value) {

   if (!dmz.object.timeStamp(handle, dmz.stance.CreatedAtGameTimeHandle)) {

//      self.log.warn("created at serve time: " + toDate(value));
//      self.log.warn("created at game  time: " + toDate(_exports.gameTime(value)));
      dmz.object.timeStamp(handle, dmz.stance.CreatedAtGameTimeHandle, _exports.gameTime(value));
   }
});

dmz.object.data.observe(self, GameStartTime, function (handle, attr, value) {

   if (handle === _game.handle) {

      _server.start = toDate(value.number("server", 0));
      _game.start = toDate(value.number("game", 0));
      _game.factor = value.number("factor", 0);
   }
});

_exports.gameTime = function (serverTime) {

   var timeStamp = serverTime || _export.serverTime()
     , result
     , now
     , time = {}
     , span
     ;

   if (_game.active) {

      if (timeStamp instanceof Date) { now = timeStamp; }
      else { now = toDate(timeStamp); }

      time = _game.start.clone();
      span = new DateJs.TimeSpan(now - _server.start);

      time.addDays(span.getDays() * _game.factor);

      time.set(
        { millisecond: now.getMilliseconds()
        , second: now.getSeconds()
        , minute: now.getMinutes()
        , hour: now.getHours()
        }
      );

      result = toTimeStamp(time);
   }
   else { result = _exports.serverTime(); }

   return result;
}

_exports.serverTime = function (timeStamp) {

   var result = dmz.time.getFrameTime();

   if (timeStamp) {

      if (timeStamp instanceof Date) { timeStamp = toTimeStamp(timeStamp); }
      dmz.time.setFrameTime(timeStamp);
      result = timeStamp;

      self.log.info("Server Time: " + toDate(timeStamp));
      self.log.info("  Game Time: " + toDate(_exports.gameTime(timeStamp)));
   }

   return result;
};

// Publish module
dmz.module.publish(self, _exports);
