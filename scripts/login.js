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
       , sys: require("sys")
       , ui:
          { mainWindow: require("dmz/ui/mainWindow")
          , messageBox: require("dmz/ui/messageBox")
          }
       }
    // UI
    , disabledDialog =
         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Warning
            , text: "Your account has been disabled. Please contact your professor to get it reenabled. STANCE will now exit."
            , standardButtons: [dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Ok
            }
            , dmz.ui.mainWindow.centralWidget()
            )
    , failedDialog =
         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Warning
            , text: "Unable to connect to game server!"
            , informativeText: "You are now in offline use mode!"
            , standardButtons: [dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Ok
            }
            , dmz.ui.mainWindow.centralWidget()
            )

    // Constants
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , LogoutMessage = dmz.message.create("Logout_Message")
    , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
    , LoginErrorMessage = dmz.message.create("Login_Error_Message")
    , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")

    // Variables
    , _window = dmz.ui.mainWindow.window()
    , _title = _window.title()
    , _gameHandle
    , _userList = []
    , _userName
    , _userHandle
    , _admin = false
    , _loginQueue = false
    , _haveSetServerTime = false
    , _haveToggled = false
    , _hasLoggedIn = false
    , _loginSkipped = false
    , ToggledMessage = dmz.message.create("ToggledGroupMessage")
    , lastLogin = 0

    // Functions
    , toTimeStamp = dmz.util.dateToTimeStamp
    , toDate = dmz.util.timeStampToDate
    , _setTitle
    , _activateUser
    , _login
    ;

self.shutdown = function () { _window.title(_title); };

_activateUser = function (name) {

   var handle
     , logins
     ;

   if (_userName && (name === _userName)) {

      handle = _userList[_userName];
      if (handle) {

         if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }
         if (dmz.object.flag(handle, dmz.stance.ActiveHandle)) {

            dmz.object.flag(handle, dmz.object.HILAttribute, true);
            //dmz.object.flag(_userHandle, dmz.stance.UpdateLastLoginTimeHandle, true);
            dmz.object.timeStamp(_userHandle, dmz.stance.LastPingTimeHandle, 0);
            if (!_hasLoggedIn && !_loginSkipped) {

               logins = dmz.object.scalar(_userHandle, dmz.stance.ActiveHandle) || 0;
               logins += 1;
               dmz.object.scalar(_userHandle, dmz.stance.ActiveHandle, logins);
               _hasLoggedIn = true;
            }
            if (logins >= 20) {

               dmz.stance.unlockAchievement(_userHandle, dmz.stance.WelcomeBackThreeAchievement);
            }
            else if (logins >= 10) {

               dmz.stance.unlockAchievement(_userHandle, dmz.stance.WelcomeBackTwoAchievement);
            }
            else if (logins >= 2) {

               dmz.stance.unlockAchievement(_userHandle, dmz.stance.WelcomeBackOneAchievement);
            }
            if (dmz.object.flag(_userHandle, dmz.stance.ConsecutiveLoginsHandle)) { dmz.stance.unlockAchievement(_userHandle, dmz.stance.FrequentFlyerAchievement); }
         }
         else { disabledDialog.open(self, function () { dmz.sys.requestExit(); }); }
      }
   }
};

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   dmz.time.setTimer(self, 2, function () {

      var type = dmz.object.type(objHandle)
        , value = dmz.object.text(objHandle, dmz.stance.NameHandle)
        ;

      if (type && type.isOfType(dmz.stance.UserType)) {

         _userList[value] = objHandle;
         _activateUser (value);
      }
   });
});

_login = function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      _window.title(_title);
      _admin = data.boolean("admin");
      lastLogin = data.number(TimeStampAttr);
      dmz.time.setTimer(self, 2, function () {

         _userName = data.string(dmz.stance.NameHandle);
         _activateUser(_userName);
      });
   }
};

LoginSuccessMessage.subscribe(self, function (data) {

   if (_gameHandle) { _login (data); }
   else { _loginQueue = data; }
});

LoginSkippedMessage.subscribe(self, function () {

   var handle = dmz.object.hil();
   _loginSkipped = true;
   dmz.object.flag(handle, dmz.object.HILAttribute, false);
   dmz.object.flag(handle, dmz.object.HILAttribute, true);
});

LoginErrorMessage.subscribe(self, function () {

   failedDialog.open(self, function () {});
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

   dmz.time.setTimer(self, 2, function () {

      var type = dmz.object.type(handle);
      if (type && type.isOfType (dmz.stance.UserType)) {

         _userList[value] = handle;
         _activateUser (value);
      }
   });
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
     , logins
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
      if (lastLogin) {
      	
      	dmz.object.timeStamp(handle, dmz.stance.LastLoginTimeHandle, lastLogin);
      }
   }
});

_setTitle = function (userHandle) {

   var groupName
     , unverified = "*"
     ;

   if (userHandle) {

      if (dmz.object.text(_userHandle, dmz.stance.NameHandle) === _userName) { unverified = ""; }
      groupName = dmz.stance.getDisplayName(dmz.stance.getUserGroupHandle(_userHandle));
      if (dmz.stance.isAllowed(userHandle, dmz.stance.SwitchGroupFlag) && !_haveToggled || !groupName) {

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

ToggledMessage.subscribe(self, function (data) { _haveToggled = true; });
