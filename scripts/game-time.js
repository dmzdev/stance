require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
       { stanceConst: require("const")
       , object: require("dmz/components/object")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , module: require("dmz/runtime/module")
       , objectType: require("dmz/runtime/objectType")
       , util: require("dmz/types/util")
       }
    , DateJs = require("datejs/time")
    // Constants
    , OneMinute = 60
    , OneHour = OneMinute * 60
    , OneDay = OneHour * 24
    , UpdateInterval = self.config.number("update-interval.value", 1.0)
    // Variable
    , _exports = {}
    , _game = {}
    , _lastTime = 0
    , _serverTime = 0
    , _gameTime = {}
    , _segment = 0
    // Fuctions
    , toDate = dmz.util.timeStampToDate
    , toTimeStamp = dmz.util.dateToTimeStamp
    , _calculateGameTime
    , _lookupGameTime
    , _updateGameTime
    ;

_game.startedAt = function () {

   var result;

   if (this.handle) {

      result = toDate(dmz.object.timeStamp (this.handle, dmz.stanceConst.GameStartTimeHandle));
   }

   return result;
}

//_playInRealTime = function () {

//   var result = true;

//   if (_gameTimeFactor != 1) {

//      _hyperTimeStart = new Date(_serverTime).clearTime().addHours(RealTimeEnd);
//      _hyperTimeEnd = new Date(_serverTime).clearTime().addHours (RealTimeStart);

//      if (_serverTime.between (_hyperTimeStart, _hyperTimeEnd)) {

//         result = false;

//         // always run realtime on weekends, sat=6, sun=0
//         if ((_serverTime.getDay () === 6) || (_serverTime.getDay () === 0)) {

//            result = true;
//         }
//      }
//   }

//   return result;
//}

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.stanceConst.GameType)) {

      if (!_game.handle) {

         _game.handle = handle;
         self.log.warn("_game.handle: " + _game.handle);
      }
   }
});

dmz.object.flag.observe(self, dmz.stanceConst.ActiveHandle, function (handle, attr, value) {

   if (handle === _game.handle) { _game.active = value; }
});

dmz.object.data.observe(self, dmz.stanceConst.GameTimeHandle,
function (handle, attr, value) {

   var index
     , count = value.number("count", 0)
     , segment
     ;

   if (handle === _game.handle) {

      _gameTime = new Array(count);

      for (index = 0; index < count; index++) {

         segment =
           { serverDate: value.number("serverDate", index)
           , startHour: value.number("startHour", index)
           , startMinute: value.number("startMinute", index)
           , endHour: value.number("endHour", index)
           , endMinute: value.number("endMinute", index)
           , startDate: value.number("startDate", index)
           , endDate: value.number("endDate", index)
         };

         _gameTime[index] = segment;
      }
   }
});

_calculateGameTime = function (today) {

   var segment = _gameTime[_segment]
     ;

   self.log.warn("calculateGameTime: " + today);
};

_lookupGameTime = function (today) {

   var segment = _gameTime[_segment]
     , server = {}
     , game = {}
     , time = {}
     , nextSegment
     , nextUpdate
     ;

   if ((today.getDay () === 0) || (today.getDay () === 6)) {

      self.log.warn("weekend: " + today);

//      _calculateWeekendGameTime (today, segment);
   }
   else {

      time.now =
         (today.getHours () * OneHour) +
         (today.getMinutes() * OneMinute) +
         today.getSeconds();

      time.start = (segment.startHour * OneHour) + (segment.startMinute * OneMinute);
      time.end = (segment.endHour * OneHour) + (segment.endMinute * OneMinute);

      // real time
      if (time.now < time.start) {

         game.start = toDate(segment.startDate);

         game.time = game.start.clone().set(
            { millisecond: today.getMilliseconds()
            , second: today.getSeconds()
            , minute: today.getMinutes()
            , hour: today.getHours()
            }
         );

         game.time = toTimeStamp(game.time);
         game.factor = 1;

         game.start.setHours(segment.startHour);
         game.start.setMinutes(segment.startMinute);
         game.start = toTimeStamp(game.start);

         nextUpdate = game.start - game.time;
      }
      else if (time.now >= time.end) {

         game.end = toDate(segment.endDate);

         game.time = game.end.clone().set(
            { millisecond: today.getMilliseconds()
            , second: today.getSeconds()
            , minute: today.getMinutes()
            , hour: today.getHours()
            }
         );

         game.time = toTimeStamp(game.time);
         game.factor = 1;

         if ((_segment + 1) < _gameTime.length) {

            nextSegment = _gameTime[_segment+1];

            game.start =
               nextSegment.startDate +
               (nextSegment.startHour * OneHour) +
               (nextSegment.startMinute * OneMinute);
         }
         else {

            game.start =
               segment.endDate +
               OneDay +
               (segment.startHour * OneHour) +
               (segment.startMinute * OneMinute);
         }

         game.delta = game.start - game.time;
      }
      else { // hyper time

         server.start =
            segment.serverDate +
            (segment.startHour * OneHour) +
            (segment.startMinute * OneMinute);

         server.end =
            segment.serverDate +
            (segment.endHour * OneHour) +
            (segment.endMinute * OneMinute);

         server.now = toTimeStamp(today);

         game.start =
            segment.startDate +
            (segment.startHour * OneHour) +
            (segment.startMinute * OneMinute);

         game.end =
            segment.endDate +
            (segment.endHour * OneHour) +
            (segment.endMinute * OneMinute);

         server.delta = server.end - server.start;
         game.delta = game.end - game.start;

         game.factor = game.delta / server.delta;

         server.scale = (server.now - server.start) / server.delta;

         game.time = game.start + (game.delta * server.scale);

//         self.log.warn("server.start: " + server.start);
//         self.log.warn("  server.end: " + server.end);
//         self.log.warn("  server.now: " + server.now);
//         self.log.warn("server.scale: " + server.scale);
//         self.log.warn("server.delta: " + (server.delta / OneHour));
//         self.log.warn("  game.start: " + game.start);
//         self.log.warn("    game.end: " + game.end);
//         self.log.warn("  game.delta: " + (game.delta / OneHour));

         nextUpdate = game.delta * (1 - server.scale);
      }

      dmz.time.setFrameTime(game.time);
      self.log.warn("   game.time: " + toDate(game.time));

      dmz.time.setTimeFactor(game.factor);
      self.log.warn(" game.factor: " + game.factor);

      self.log.warn("next update in: " + nextUpdate);
//      dmz.time.setRepeatingTimer (self, nextUpdate, _updateGameTime);
   }
};

_updateGameTime = function () {

   var now = _exports.serverTime()
     , today = toDate(now)
     , current = _segment
     , currentDate
     , nextDate
     , found = false
     , segment
     , gameTime
     , weekend = false
     , realTime = false
     , hour
     , startHour
     , endHour
     , dayStart
     , dayEnd
     , gameDayStart
     , gameDayEnd
     ;

   self.log.warn("_updateGameTime: " + today);

   if (_game.handle && _game.active) {

      while (!found && (current < _gameTime.length)) {

         currentDate = toDate(_gameTime[current].serverDate).clearTime();

         if ((current + 1) < _gameTime.length) {

            nextDate = toDate(_gameTime[current+1].serverDate).clearTime();
         }
         else { nextDate = false }

         if (nextDate && today.between(currentDate, nextDate)) {

            _segment = current;
            found = true;
         }

         current += 1;
      }

      if (found) {

         self.log.warn("found: " + _segment);
//         segment = _gameTime[_segment];

         _lookupGameTime(today);

//         startHour = _gameTime[_segment].startHour;
//         endHour = _gameTime[_segment].endHour;

//         today = toDate(now);

//         if ((today.getHours () < startHour) || (today.getHours() > endHour)) {

//            realTime = true;
//         }

//         self.log.warn("weekend: " + weekend);
//         self.log.warn("realTime: " + realTime);

//         if (realTime || weekend) {

//            gameTime = _gameTime[_segment].startDate;
//         }
      }
      else {

         _segment = _gameTime.length - 1;
         _calculateGameTime(today);

         self.log.error("not found: " + _segment);
//         segment = _gameTime[_segment];
      }


//      while (current && !done) {

//         serverDate = toDate(current.serverDate).clearTime();

//         if (today === serverDate) {

//            _gameTime = current;
//            done = true;
//         }
//         else {

//            _gameTime = current;
//            current = _getNextSegment();
//         }

//         self.log.warn("_gameTime.serverDate: " + toDate(_gameTime.serverDate));
//      }

//      if (done) {

//         self.log.warn("Found exact match");
//      }
//      else {

//         self.log.error("Need to calculate latest time");
//      }

//      self.log.warn("_gameTime.serverDate: " + toDate(_gameTime.serverDate));

//      while (next && (now > next.serverDate)) {

//         _gameTime = segment;
//         next = _getNextSegment();
//      }

//      if (_gameTime.current) {

//         if (_gameTime.next) {

//            var delta = now - _gameTime.next
//         }
//         else {

//         }
//      }

//      self.log.warn("currentTime: " + toDate(currentTime));
//      self.log.warn(" serverDate: " + toDate(_gameTime.serverDate));
//      var span = new DateJs.TimeSpan(delta*1000);
//      self.log.info("span: " + span);
//      self.log.info("delta: " + delta/OneDay);

//      self.log.warn(" startDate: " + _gameTime.startDate);
//      self.log.warn("   endDate: " + _gameTime.endDate);

//      if (_getNextSegment(_current)) {

//         self.log.warn("serverDate: " + _current.serverDate);
//         self.log.warn(" startDate: " + _current.startDate);
//         self.log.warn("   endDate: " + _current.endDate);
//      }
   }

//   self.log.error("_it: " + _it);

// FIXME: calculate for real
//dmz.time.setFrameTime(_serverTime);
//dmz.time.setTimeFactor(1.0);
};


dmz.object.timeStamp.observe(self, dmz.stanceConst.ServerTimeHandle,
function (handle, attr, value) {

   if ((handle === _game.handle) && _game.active) {

      self.log.warn("serverTime: " + value);

//      _serverTime = value;
//      _time = dmz.time.getSystemTime()


//      _getCurrentAndNext (_calculateGameTime);

//      _getCurrentAndNext (function (current, next) {

//         self.log.warn("REAL TIME: " + current);
//         self.log.warn("REAL TIME: " + next);
//      });

//      if (serverTime.)
////      startTime = _game.startedAt();
//      data = dmz.object.data(_game.handle, dmz.stanceConst.GameTimeHandle);

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

//      dmz.object.timeStamp(_game.handle, dmz.stanceConst.GameTimeHandle, value);
//      self.log.error("_serverTime: " + _serverTime);

// for now just set game time to be server time
//dmz.time.setFrameTime(value);
//dmz.time.setTimeFactor(2.0);
   }
});

//dmz.object.timeStamp.observe(self, dmz.stanceConst.GameTimeHandle,
//function (handle, attr, value) {

//   if (handle === _game.handle) {

//      dmz.time.setFrameTime(value);
//self.log.warn("gameTime: " + dmz.util.timeStampToDate(value));
//   }
//});

//dmz.object.scalar.observe(self, dmz.stanceConst.GameTimeFactorHandle,
//function (handle, attr, value) {

//   if (handle === _game.handle) {

//      dmz.time.setTimeFactor(value);
//self.log.warn("gameTimeFactor: " + value);
//   }
//});

//dmz.time.setRepeatingTimer (self, UpdateInterval, function (Delta) {

//   var time = dmz.time.getSystemTime()
//     ;

//   _serverTime += (time - _lastTime);
//   _lastTime = time;

//   if (_game.handle) {

////      dmz.object.timeStamp(_game.handle, dmz.stanceConst.ServerTimeHandle, _serverTime);
//   }
//});

//dmz.time.setRepeatingTimer (self, UpdateInterval, function (Delta) {

//   if (_game.handle) {

//      dmz.object.timeStamp(_game.handle, dmz.stanceConst.ServerTimeHandle, _exports.serverTime());
//      dmz.object.timeStamp(_game.handle, dmz.stanceConst.GameTimeHandle, _exports.gameTime());
//   }
//});

_exports.gameTime = function () {

   return dmz.time.getFrameTime();
}

_exports.serverTime = function (timeStamp) {

   var time = dmz.time.getSystemTime();

   if (timeStamp) {

      if (timeStamp instanceof Date) { timeStamp = toTimeStamp(timeStamp); }

      _serverTime = timeStamp;

      if (_game.handle) {

//         dmz.object.timeStamp(_game.handle, dmz.stanceConst.ServerTimeHandle, _serverTime);

         if (_game.active) {

            _updateGameTime();
         }
      }
   }
   else {

      _serverTime += (time - _lastTime);
   }

   _lastTime = time;

   return _serverTime;
};


// Publish module
dmz.module.publish(self, _exports);
