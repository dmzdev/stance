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
    , _calculateWeekendGameTime
    , _lookupGameTime
    , _updateGameTime
    , _updateGameTimeStamps
    ;

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.stanceConst.GameType)) {

      if (!_game.handle) { _game.handle = handle; }
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
           , endHour: value.number("endHour", index)
           , startDate: value.number("startDate", index)
           , endDate: value.number("endDate", index)
         };

         _gameTime[index] = segment;
      }
   }
});

_calculateGameTime = function (today) {

   var segment = _gameTime[_segment]
     , server = {}
     , game = {}
     , time = {}
     , current = toDate(segment.serverDate)
     , realHours = 0
     , hyperHours = 0
     ;

   segment.realHoursPre = segment.startHour;
   segment.hyperHours = segment.endHour - segment.startHour;
   segment.realHoursPost = 24 - segment.endHour;

   server.today = today.clone().clearTime();

   server.start = segment.serverDate + (segment.startHour * OneHour);
   server.end = segment.serverDate + (segment.endHour * OneHour);
   server.delta = server.end - server.start;

   game.start = segment.startDate + (segment.startHour * OneHour);
   game.end = segment.endDate + (segment.endHour * OneHour);

   game.delta = game.end - game.start;
   game.factor = game.delta / server.delta;

   self.log.warn(" delta: " + game.delta/OneHour);
   self.log.warn("factor: " + game.factor);

   while (current.compareTo(server.today) < 0) {

      if ((current.getDay () === 0) || (current.getDay() === 6)) {

         realHours += 24;
         current.addDays (1);
      }
      else {

         if (current.getHours () < segment.startHour) {

            realHours += segment.realHoursPre;
            current.addHours(segment.realHoursPre);
         }
         else if (current.getHours() >= segment.endHour) {

            realHours += segment.realHoursPost;
            current.addHours(segment.realHoursPost);
         }
         else {

            hyperHours += segment.hyperHours;
            current.addHours(segment.hyperHours);
         }
      }

      self.log.warn("  current: " + current);
   }

   self.log.warn(" realHours: " + realHours);
   self.log.warn("hyperHours: " + hyperHours);

   game.time = toDate(segment.startDate);
   game.time.addHours(realHours);
   game.time.addHours(hyperHours * game.factor);

   self.log.info("  current: " + current);
   self.log.info(" game.time: " + game.time);

   time.now =
      (today.getHours () * OneHour) +
      (today.getMinutes() * OneMinute) +
      today.getSeconds();

   time.start = (segment.startHour * OneHour);
   time.end = (segment.endHour * OneHour);

   if (time.now < time.start) {

      self.log.warn("real time start of day: " + current);

      game.start = game.time.clone();

      game.time.set(
         { millisecond: today.getMilliseconds()
         , second: today.getSeconds()
         , minute: today.getMinutes()
         , hour: today.getHours()
         }
      );

      game.time = toTimeStamp(game.time);
      game.factor = 1;
   }
   else if (time.now >= time.end) {

      self.log.warn("real time end of day: " + current);

      game.end = game.time.clone();
      game.end.addHours(segment.hyperHours * game.factor);

      game.time = game.end.clone().set(
         { millisecond: today.getMilliseconds()
         , second: today.getSeconds()
         , minute: today.getMinutes()
         , hour: today.getHours()
         }
      );

      game.time = toTimeStamp(game.time);
      game.factor = 1;
   }
   else {

      self.log.warn("hyper time of day: " + current);

      server.current = toTimeStamp(current);
      server.start = server.current + (segment.startHour * OneHour);
      server.end = server.current + (segment.endHour * OneHour);
      server.now = toTimeStamp(today);
      server.delta = server.end - server.start;

      game.start = toTimeStamp(game.time) + (segment.startHour * OneHour);
      game.end = game.start + (server.delta * game.factor);

      game.delta = game.end - game.start;
      self.log.warn("delta: " + game.delta/OneHour);

      game.factor = game.delta / server.delta;
      self.log.warn("game.factor: " + game.factor);

      server.scale = (server.now - server.start) / server.delta;

      game.time = game.start + (game.delta * server.scale);
   }


   self.log.info("game.time: " + toDate(game.time));
   self.log.warn("calculateGameTime: " + today);
};


_calculateWeekendGameTime = function (today) {

   var segment = _gameTime[_segment]
     , nextSegment = _gameTime[_segment+1]
     , server = {}
     , game = {}
     ;

   server.prevDate = toDate(segment.serverDate);
   server.timeSpan = new DateJs.TimeSpan(today - server.prevDate);

   game.start = toDate(segment.endDate);
   game.start.addDays(server.timeSpan.getDays());

   game.time = game.start.clone().set(
      { millisecond: today.getMilliseconds()
      , second: today.getSeconds()
      , minute: today.getMinutes()
      , hour: today.getHours()
      }
   );

   game.time = toTimeStamp(game.time);
   game.factor = 1;

   game.start = nextSegment.startDate + (nextSegment.startHour * OneHour);

   game.nextUpdate = game.start - game.time;

   return game;
};

_lookupGameTime = function (today) {

   var segment = _gameTime[_segment]
     , server = {}
     , game = {}
     , time = {}
     , nextSegment
     ;

self.log.warn("_lookupGameTime: " + today);

   if ((today.getDay () === 0) || (today.getDay () === 6)) {

      game = _calculateWeekendGameTime (today);
   }
   else {

      time.now =
         (today.getHours () * OneHour) +
         (today.getMinutes() * OneMinute) +
         today.getSeconds();

      time.start = (segment.startHour * OneHour);
      time.end = (segment.endHour * OneHour);

      // real time
      if (time.now < time.start) {

self.log.warn("realTime start of day: " + today);

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
         game.start = toTimeStamp(game.start);

         game.nextUpdate = game.start - game.time;
      }
      else if (time.now >= time.end) {

self.log.warn("realTime end of day: " + today);

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

         nextSegment = _gameTime[_segment+1];

         game.start = nextSegment.startDate + (nextSegment.startHour * OneHour);

         game.nextUpdate = game.start - game.time;
      }
      else { // hyper time

self.log.warn("hyperTime: " + today);

         server.start = segment.serverDate + (segment.startHour * OneHour);
         server.end = segment.serverDate + (segment.endHour * OneHour);
         server.now = toTimeStamp(today);

         game.start = segment.startDate + (segment.startHour * OneHour);
         game.end = segment.endDate + (segment.endHour * OneHour);

         server.delta = server.end - server.start;
         game.delta = game.end - game.start;

         game.factor = game.delta / server.delta;

         server.scale = (server.now - server.start) / server.delta;

         game.time = game.start + (game.delta * server.scale);

         game.nextUpdate = game.delta * (1 - server.scale);
      }
   }

   self.log.info("Setting game time: " + toDate(game.time));
   dmz.time.setFrameTime(game.time);

   self.log.info("Setting game time factor: " + game.factor);
   dmz.time.setTimeFactor(game.factor);

   self.log.info("Next game time update in: " + game.nextUpdate/OneHour + " hours (" + game.nextUpdate + ")");
   if (game.nextUpdate < 10.0) { game.nextUpdate = 30.0; }

   dmz.time.setTimer (self, game.nextUpdate, function (DeltaTime) {

      var delta = Math.abs (DeltaTime - game.time);

      // this gets called to soon on first time because setFrameTime is called on the next sync,
      // so lets not do anything if game.time is really close to Delta time -ss
      if (delta < 10.0) {

         dmz.time.setTimer(self, game.nextUpdate, _updateGameTime);
      }
      else { _updateGameTime(); }
   });
};

_updateGameTime = function () {

   var now = _exports.serverTime()
     , today = toDate(now)
     , current = _segment
     , currentDate
     , nextDate
     , found = false
     ;

   self.log.error("_updateGameTime: " + today);

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

         _lookupGameTime(today);
      }
      else {

         _segment = _gameTime.length - 1;
         _calculateGameTime(today);

self.log.error("not found: " + _segment);

         // FIXME: calculate for real
         //dmz.time.setFrameTime(_serverTime);
         //dmz.time.setTimeFactor(1.0);
      }
   }
   else {

      dmz.time.setFrameTime(now);
      dmz.time.setTimeFactor(1.0);
   }
};

//dmz.object.timeStamp.observe(self, dmz.stanceConst.ServerTimeHandle,
//function (handle, attr, value) {

//   if ((handle === _game.handle) && _game.active) {

//      self.log.warn("serverTime: " + value);
//   }
//});

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

_updateGameTimeStamps = function () {

   var local = _exports.localTime()
     , server = _exports.serverTime()
     , game = _exports.gameTime()
     , delta = server - local;
     ;

   if (_game.handle) {

      if (Math.abs(delta) < 0.1) { delta = 0.0; }

      dmz.object.counter(_game.handle, "local_time_delta", delta);
      dmz.object.timeStamp(_game.handle, dmz.stanceConst.LocalTimeHandle, local);
      dmz.object.timeStamp(_game.handle, dmz.stanceConst.ServerTimeHandle, server);
      dmz.object.timeStamp(_game.handle, dmz.stanceConst.GameTimeHandle, game);
   }
};

dmz.time.setRepeatingTimer (self, UpdateInterval, _updateGameTimeStamps);

_exports.localTime = function () {

   return toTimeStamp(new Date());
};

_exports.gameTime = function () {

   return dmz.time.getFrameTime();
};

_exports.serverTime = function (timeStamp) {

   var time = dmz.time.getSystemTime()
     , local = toTimeStamp(new Date())
     , delta


   if (timeStamp) {

      if (timeStamp instanceof Date) { timeStamp = toTimeStamp(timeStamp); }

      _serverTime = timeStamp;

      if (_game.handle) {

         delta = _serverTime - local;
         if (Math.abs(delta) < 0.1) { delta = 0.0; }

         dmz.object.timeStamp(_game.handle, "local_time", local);
         dmz.object.counter(_game.handle, "local_time_delta", delta);

         self.log.info(" Local time: " + toDate(local) + " (" + (delta) + ")");
      }

      self.log.info("Server time: " + toDate(_serverTime));

      _updateGameTime();
      _updateGameTimeStamps();
   }
   else {

      _serverTime += (time - _lastTime);
   }

   _lastTime = time;

   return _serverTime;
};


// Publish module
dmz.module.publish(self, _exports);


//   if (1) {
//      var timeSegment =
//          [ { serverDate: Date.parse("3/23/11")
//            , startHour: 6
//            , endHour: 18
//            , startDate: Date.parse("1/1/12")
//            , endDate: Date.parse("1/2/12")
//            }
//          ,
//            { serverDate: Date.parse("3/24/11")
//            , startHour: 6
//            , endHour: 18
//            , startDate: Date.parse("1/3/12")
//            , endDate: Date.parse("1/4/12")
//            }
//          ,
//            { serverDate: Date.parse("3/25/11")
//            , startHour: 6
//            , endHour: 18
//            , startDate: Date.parse("1/5/12")
//            , endDate: Date.parse("1/6/12")
//            }
//          ,
//            { serverDate: Date.parse("3/28/11")
//            , startHour: 6
//            , endHour: 18
//            , startDate: Date.parse("1/9/12")
//            , endDate: Date.parse("1/10/12")
//            }
//          ,
//            { serverDate: Date.parse("3/29/11")
//            , startHour: 6
//            , endHour: 18
//            , startDate: Date.parse("2/11/12")
//            , endDate: Date.parse("2/12/12")
//            }
//          ]
//          ;
//      var data = dmz.data.create()
//        , ix
//        ;
//      ix = 0;
//      timeSegment.forEach (function (obj) {
//         data.number("serverDate", ix, toTimeStamp(obj.serverDate));
//         data.number("startHour", ix, obj.startHour);
//         data.number("endHour", ix, obj.endHour);
//         data.number("startDate", ix, toTimeStamp(obj.startDate));
//         data.number("endDate", ix, toTimeStamp(obj.endDate));
//         ix++;
//      });
//      data.number("count", 0, timeSegment.length);
//      dmz.object.data(_gameHandle, dmz.const.GameTimeHandle, data);
//   }
