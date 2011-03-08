var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       , mainWindow: require("dmz/ui/mainWindow")
       }
    // Constants
    , UserType = dmz.objectType.lookup("user")
    , NameAttr = dmz.defs.createNamedHandle("name")
    , CookieAttr = dmz.defs.createNamedHandle("cookie")
    , HILAttr = dmz.object.HILAttribute
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , LogoutMessage = dmz.message.create("Logout_Message")
    // Variables
    , _window = dmz.mainWindow.window()
    , _title = _window.title()
    , _userList = []
    , _userName
    , _userHandle
    // Fuctions
    , _activateUser
    ;

self.shutdown = function () {

   _window.title(_title);
};


_activateUser = function (name) {

   if (_userHandle) { dmz.object.flag(_userHandle, HILAttr, false); }

   if (_userName && (name === _userName)) {

      var handle = _userList[_userName];
      if (handle) {

         dmz.object.flag(handle, HILAttr, true);

         _window.title(_title + " (" + _userName + ")");
         self.log.info("User identified: " + _userName);
      }
   }
}


LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      _userName = data.string(NameAttr);
      _activateUser(_userName);
   }
});


LogoutMessage.subscribe(self, function () {

   _activateUser(undefined);
});


dmz.object.text.observe(self, NameAttr, function (handle, attr, value) {

   var type = dmz.object.type(handle);

   if (type && type.isOfType (UserType)) {

      _userList[value] = handle;

      _activateUser (value);
   }
});


dmz.object.flag.observe(self, dmz.object.HILAttribute, function (handle, attr, value) {

                           self.log.warn("HIL set");
   var type = dmz.object.type(handle)

   if (handle === _userHandle) {

      if (!value) {

         _userHandle = undefined;
         _window.title(_title);
      }
   }

   if (value && type && type.isOfType(UserType)) { _userHandle = handle; }
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

