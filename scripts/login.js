var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , module: require("dmz/runtime/module")
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
    , _timeMod
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

         if (_admin) { dmz.object.flag(handle, dmz.const.AdminFlagHandle, true); }

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

//         dmz.object.text(_gameHandle, dmz.const.UserNameHandle, _userName);

         if (_timeMod) { _timeMod.setServerTime(data.number(TimeStampAttr)); }
         else { self.log.error("Failed to to set server time"); }

         _activateUser(_userName);
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

dmz.module.subscribe(self, "game-time", function (Mode, module) {

   if (Mode === dmz.module.Activate) { _timeMod = module; }
   else if (Mode === dmz.module.Deactivate) { _timeMod = undefined; }
});

(function () {

   if (self.config.boolean("fake-login.value", false)) {

      dmz.time.setTimer(self, 0.5, function () {

         var data = dmz.data.create()
//           , date = new Date()
           , date = Date.parse("5:59:40 pm 3/28/11")
           ;


         data.string(dmz.const.NameHandle, 0, self.config.string("fake-login.name", "dmz"));
         data.boolean(dmz.const.AdminHandle, 0, self.config.boolean("fake-login.admin", false));
         data.number(TimeStampAttr, 0, toTimeStamp(date));

         self.log.warn(">>> Faking user login! <<<");
         LoginSuccessMessage.send(data);
      });
   }
}());
