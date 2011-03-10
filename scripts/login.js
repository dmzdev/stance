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
    , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
    , LogoutMessage = dmz.message.create("Logout_Message")
    // Variables
    , _window = dmz.ui.mainWindow.window()
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

   var handle;

   if (_userName && (name === _userName)) {

      handle = _userList[_userName];

      if (handle) {

         if (_userHandle) { dmz.object.flag(_userHandle, dmz.object.HILAttribute, false); }

         dmz.object.flag(handle, dmz.object.HILAttribute, true);
      }
   }
}


LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      _window.title(_title);
      _userName = data.string(dmz.const.NameHandle);
      _activateUser(_userName);
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

         _userHandle = undefined;
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
