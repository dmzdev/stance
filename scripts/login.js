require ("datejs/date");
var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , module: require("dmz/runtime/module")
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
    , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
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
    , _loginQueue = false
    , _haveSetServerTime = false
    , _haveToggled = false
    , ToggledMessage = dmz.message.create("ToggledGroupMessage")
    // Functions
    , toTimeStamp = dmz.util.dateToTimeStamp
    , toDate = dmz.util.timeStampToDate
    , _setTitle
    , _activateUser
    , _login
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
         if (_admin) { dmz.object.flag(handle, dmz.stance.AdminHandle, true); }
         dmz.object.flag(handle, dmz.object.HILAttribute, true);
      }
   }
}

_login = function (data) {

   var timeStamp
     , date
     ;

   if (data && dmz.data.isTypeOf(data)) {

      _window.title(_title);
      _admin = data.boolean("admin");
      _userName = data.string(dmz.stance.NameHandle);

      if (_timeMod) {

         timeStamp = data.number(TimeStampAttr);
         date = toDate(timeStamp);
         date.add(-date.getTimezoneOffset("PST", date.isDaylightSavingTime())).minutes();
         timeStamp = toTimeStamp(date);
         _timeMod.serverTime(timeStamp);

         self.log.warn("Server Time: " + toDate(timeStamp));
         self.log.warn("  Game Time: " + toDate(_timeMod.gameTime(timeStamp)));
         _haveSetServerTime = true;
      }
      else { self.log.error("Failed to to set server time"); }

      _activateUser(_userName);
   }
}

LoginSuccessMessage.subscribe(self, function (data) {

   if (_gameHandle) { _login (data); }
   else { _loginQueue = data; }
});

LoginSkippedMessage.subscribe(self, function () {

   var handle = dmz.object.hil();
   dmz.object.flag(handle, dmz.object.HILAttribute, false);
   dmz.object.flag(handle, dmz.object.HILAttribute, true);
});

LogoutMessage.subscribe(self, function () {

   if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }
});

dmz.object.create.observe(self, function (handle, type) {

   if (type.isOfType(dmz.stance.GameType)) {

      if (!_gameHandle) {

         _gameHandle = handle;
         if (_loginQueue) {

            _login (_loginQueue);
            _loginQueue = false;
         }
      }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle);
   if (type && type.isOfType (dmz.stance.UserType)) {

      _userList[value] = handle;
      _activateUser (value);
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, userHandle, groupHandle) {

   if (_userHandle && (userHandle === _userHandle)) { _setTitle(userHandle); }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , name
     , unverified = "*"
     , timeStamp
     , groupName
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
      name = dmz.stance.getDisplayName(_userHandle);
      _setTitle(_userHandle);
      self.log.info("User identified: " + name);
   }
});

_setTitle = function (userHandle) {

   var groupName
     , unverified = "*"
     ;

   if (userHandle) {

      if (dmz.object.text(_userHandle, dmz.stance.NameHandle) === _userName) { unverified = ""; }
      groupName = dmz.stance.getDisplayName(dmz.stance.getUserGroupHandle(_userHandle));
      if ((dmz.object.flag(_userHandle, dmz.stance.AdminHandle) && !_haveToggled) || !groupName) {

         groupName = "N/A";
      }
      _window.title(
         _title + " ("
         + dmz.stance.getDisplayName(_userHandle) + ", "
         + groupName
         + ")"
         + unverified
         );
   }
};

dmz.module.subscribe(self, "game-time", function (Mode, module) {

   if (Mode === dmz.module.Activate) { _timeMod = module; }
   else if (Mode === dmz.module.Deactivate) { _timeMod = undefined; }
});

ToggledMessage.subscribe(self, function (data) { _haveToggled = true; });

(function () {

   if (self.config.boolean("fake-login.value", false)) {

      dmz.time.setTimer(self, 0.5, function () {

         var data = dmz.data.create()
//           , date = new Date()
           , date = Date.parse("5:59:40 pm 3/9/11")
           ;

         data.string(dmz.stance.NameHandle, 0, self.config.string("fake-login.name", "dmz"));
         data.boolean(dmz.stance.AdminHandle, 0, self.config.boolean("fake-login.admin", false));
         data.number(TimeStampAttr, 0, toTimeStamp(date));

         self.log.warn(">>> Faking user login! <<<");
         LoginSuccessMessage.send(data);
      });
   }
}());
