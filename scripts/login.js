var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       , util: require("dmz/types/util")
       , const: require("const")
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

            dmz.object.flag(handle, dmz.const.AdminFlagHandle, true);
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
         _userName = data.string(dmz.const.NameHandle);

         dmz.object.text(_gameHandle, dmz.const.UserNameHandle, _userName);

         dmz.object.timeStamp(
            _gameHandle,
            dmz.const.ServerTimeHandle,
            data.number(TimeStampAttr));

         _activateUser(_userName);

         if (1) {

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
              , ix
              ;

            ix = 0;
            timeSegment.forEach (function (obj) {

               data.number("serverDate", ix, toTimeStamp(obj.serverDate));
               data.number("startHour", ix, obj.startHour);
               data.number("endHour", ix, obj.endHour);
               data.number("startDate", ix, obj.startDate);
               data.number("endDate", ix, obj.endDate);
               ix++;
            });

            dmz.object.data(_gameHandle, dmz.const.GameTimeHandle, data);
         }
      }
   }
});

LogoutMessage.subscribe(self, function () {

   if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }
});

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.const.GameType)) {

      if (!_gameHandle) { _gameHandle = handle; }
   }
});

dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle);
   if (type && type.isOfType (dmz.const.UserType)) {

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

   if (value && type && type.isOfType(dmz.const.UserType)) {

      _userHandle = handle;

      name = dmz.object.text(_userHandle, dmz.const.NameHandle);
      if (name === _userName) { unverified = ""; }

      _window.title(_title + " (" + name + ")" + unverified);

      self.log.info("User identified: " + name);
   }
});

(function () {

   if (self.config.boolean("fake-login.value", false)) {

      dmz.time.setTimer(self, 0.5, function () {

         var data = dmz.data.create();

         data.string(dmz.const.NameHandle, 0, self.config.string("fake-login.name", "dmz"));
         data.boolean(dmz.const.AdminHandle, 0, self.config.boolean("fake-login.admin", false));
         data.number(TimeStampAttr, 0, Date.now()/1000);

         self.log.warn(">>> Faking user login! <<<");
         LoginSuccessMessage.send(data);
      });
   }
}());
