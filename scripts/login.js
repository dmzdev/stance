var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       , const: require("const")
       , ui:
          { mainWindow: require("dmz/ui/mainWindow")
          }
       }
    // Constants
    , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , LogoutMessage = dmz.message.create("Logout_Message")
    // Variables
    , _window = dmz.ui.mainWindow.window()
    , _title = _window.title()
    , _userList = []
    , _userName
    , _userHandle
    , _serverTime
    // Fuctions
    , _activateUser
    ;

self.shutdown = function () {

   _window.title(_title);
};


_activateUser = function (name) {

   if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }

   if (_userName && (name === _userName)) {

      var handle = _userList[_userName];
      if (handle) {

         dmz.object.flag(handle, dmz.object.HILAttribute, true);

         _window.title(_title + " (" + _userName + ")");
         self.log.info("User identified: " + _userName);
      }
   }
}


LoginSuccessMessage.subscribe(self, function (data) {

   var timeStamp
     ;

   if (data && dmz.data.isTypeOf(data)) {

      timeStamp = data.number(TimeStampAttr);
      if (timeStamp) { _serverTime = new Date(timeStamp * 1000); }

      _userName = data.string(dmz.const.NameHandle);

      _activateUser(_userName);
   }
});


LogoutMessage.subscribe(self, function () {

   _activateUser(undefined);
});


//dmz.object.create.observe(self, function (handle, type) {

//   if (type.isOfType(dmz.const.GameType)) {

//      dmz.object.timestamp(handle, "MontereyTime", _serverTime);
//   }
//}


dmz.object.text.observe(self, dmz.const.NameHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle);
   if (type && type.isOfType (dmz.const.UserType)) {

      _userList[value] = handle;
      _activateUser (value);
   }
});


dmz.object.flag.observe(self, dmz.object.HILAttribute, function (handle, attr, value) {

   var type = dmz.object.type(handle);

   if (handle === _userHandle) {

      if (!value) {

         _userHandle = undefined;
         _window.title(_title);
      }
   }

   if (value && type && type.isOfType(dmz.const.UserType)) { _userHandle = handle; }
});


(function () {
   var target
//     , loginRequiredMessage = dmz.message.create("Login_Required_Message")
//     , archiveUpdatedMessage = dmz.message.create("Archive_Updated_Message")
//     , doLogin = true
     ;

//   if (doLogin) {

//      target = dmz.defs.createNamedHandle("dmzQtPluginLoginDialog");
//      loginRequiredMessage.send(target);
//   }

//   target = dmz.defs.createNamedHandle("dmzArchivePluginAutoCache");
//   self.log.warn("archive updated");
//   archiveUpdatedMessage.send (target);
}());

