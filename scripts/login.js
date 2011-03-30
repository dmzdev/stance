var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       , util: require("dmz/types/util")
       , stance: require("stanceConst")
       , ui:
          { mainWindow: require("dmz/ui/mainWindow")
          }
       }
    // Constants
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , LogoutMessage = dmz.message.create("Logout_Message")
    , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")
    // Variables
    , _window = dmz.ui.mainWindow.window()
    , _title = _window.title()
    , _gameHandle
    , _userList = []
    , _userName
    , _userHandle
    , _admin = false
    // Fuctions
    , toTimeStamp = dmz.util.dateToTimeStamp
    , _activateUser
    ;

self.shutdown = function () {

   _window.title(_title);
};

_activateUser = function (name) {

   var handle;

   if (_userName && (name === _userName)) {

      handle = _userList[_userName];

      if (handle) {

         if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }

         if (_admin) {

            dmz.object.flag(handle, dmz.stance.AdminFlagHandle, true);
         }
         dmz.object.flag(handle, dmz.object.HILAttribute, true);
      }
   }
}

LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      if (_gameHandle) {

         _window.title(_title);
         _admin = data.boolean("admin");
         _userName = data.string(dmz.stance.NameHandle);

         dmz.object.text(_gameHandle, dmz.stance.UserNameHandle, _userName);

         dmz.object.timeStamp(
            _gameHandle,
            dmz.stance.ServerTimeHandle,
            data.number(TimeStampAttr));

         _activateUser(_userName);

         if (0) {

            var timeSegment =
                [ { serverDate: Date.parse("3/15/11")
                  , startHour: 6
                  , endHour: 18
                  , startDate: Date.parse("1/1/12")
                  , endDate: Date.parse("1/1/12")
                  }
                ,
                  { serverDate: Date.parse("3/16/11")
                  , startHour: 6
                  , endHour: 18
                  , startDate: Date.parse("1/2/12")
                  , endDate: Date.parse("1/5/12")
                  }
                ]
                ;

            var data = dmz.data.create()
              , rtStart =
                [ Date.parse("6pm 3/15/11")
                , Date.parse("6pm 3/16/11")
                ]
              , rtEnd =
                [ Date.parse("6am 3/16/11")
                , Date.parse("6am 3/17/11")
                ]
              , gtStart =
                [ Date.parse("6pm 1/1/12")
                , Date.parse("6pm 1/2/12")
                ]
              , gtEnd =
                [ Date.parse("6am 1/2/12")
                , Date.parse("6am 1/2/12")
                ]
              , ix
              ;

            ix = 0;
            timeSegment.forEach (function (obj) {

               data.number("serverDate", ix, toTimeStamp(obj.realTimeStart));
               data.number("startHour", ix, obj.startHour);
               data.number("endHour", ix, obj.endHour);
               data.number("startDate", ix, obj.startDate);
               data.number("endDate", ix, obj.endDate);
               ix++;
            });

            for (var ix  = 0; ix < rtStart.length; ix++) {

               data.number("real_time_start", ix, dmz.util.dateToTimeStamp());
            }

            ix = 0;
            realTime.forEach(function (value) {

               data.string("real_time_2", ix, value.toString());
               data.number("real_time", ix++, dmz.util.dateToTimeStamp(value));
            });

            ix = 0;
            gameTime.forEach(function (value) {

               data.string("game_time_2", ix, value.toString());
               data.number("game_time", ix++, dmz.util.dateToTimeStamp(value));
            });

            data.number("index", 0, 0);
            data.number("index", 1, realTime.length);
            dmz.object.data(_gameHandle, dmz.stance.GameTimeHandle, data);
         }
      }
   }
});

LogoutMessage.subscribe(self, function () {

   if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }
});

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.stance.GameType)) {

      if (!_gameHandle) { _gameHandle = handle; }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle);
   if (type && type.isOfType (dmz.stance.UserType)) {

      _userList[value] = handle;
      _activateUser (value);
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , name
     , unverified = "*"
     ;

   if (handle === _userHandle) {

      if (!value) {

         _userHandle = 0;
         _window.title(_title);
         self.log.debug("User logged out");
      }
   }

   if (value && type && type.isOfType(dmz.stance.UserType)) {

      _userHandle = handle;

      name = dmz.object.text(_userHandle, dmz.stance.NameHandle);
      if (name === _userName) { unverified = ""; }

      _window.title(_title + " (" + name + ")" + unverified);

      self.log.info("User identified: " + name);
   }
});

(function () {

   if (self.config.boolean("fake-login.value", false)) {

      dmz.time.setTimer(self, 0.5, function () {

         var data = dmz.data.create();

         data.string(dmz.stance.NameHandle, 0, self.config.string("fake-login.name", "dmz"));
         data.boolean(dmz.stance.AdminHandle, 0, self.config.boolean("fake-login.admin", false));
         data.number(TimeStampAttr, 0, Date.now()/1000);

         self.log.warn(">>> Faking user login! <<<");
         LoginSuccessMessage.send(data);
      });
   }
}());
