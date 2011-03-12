var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , time: require("dmz/runtime/time")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
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

         dmz.object.flag(handle, dmz.object.HILAttribute, true);

         if (_admin) { dmz.object.flag(handle, dmz.const.AdminHandle, true); }
      }
   }
}


LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      if (_gameHandle) {

         _window.title(_title);
         _admin = data.boolean(dmz.const.AdminHandle);
         _userName = data.string(dmz.const.NameHandle);

         dmz.object.text(_gameHandle, dmz.const.UserNameHandle, _userName);

         dmz.object.timeStamp(
            _gameHandle,
            dmz.const.ServerTimeHandle,
            data.number(TimeStampAttr));

         _activateUser(_userName);

         var data = dmz.data.create()
           , start = Date.now()/1000
           , end = Date.now()/1000
           ;

         data.number("start_time", 0, start);
         data.number("end_time", 0, end);

         dmz.object.data(_gameHandle, dmz.const.GameTimeHandle, data);
      }
   }
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
   var login = self.config.boolean("fake-login.value", false);

   if (login) {

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
