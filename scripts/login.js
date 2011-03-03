var dmz =
       { object: require("dmz/components/object")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , objectType: require("dmz/runtime/objectType")
       }
    // Constants
    , UserType = dmz.objectType.lookup("user")
    , NameAttr = dmz.defs.createNamedHandle("name")
    , HILAttr = dmz.object.HILAttribute
    , LoginSuccessMessage = dmz.message.create("LoginSuccessMessage")
    // Variables
    , _userName
    , _userHandle
    ;


LoginSuccessMessage.subscribe(self, function (data) {

   if (data && dmz.data.isTypeOf(data)) {

      _userName = data.string(NameAttr);
      if (_userHandle) { dmz.object.flag(_userHandle, HILAttr, false);}
   }
});


dmz.object.text.observe(self, NameAttr, function (handle, attr, value) {

   var type = dmz.object.type(handle);

   if (type && type.isOfType (UserType)) {

      if (_userName && (value === _userName)) {

         dmz.object.flag(handle, dmz.object.HILAttribute, true);

         self.log.info("User identified: " + value);
      }
   }
});


dmz.object.flag.observe(self, dmz.object.HILAttribute, function (handle, attr, value) {

   var type = dmz.object.type(handle)

   if (handle === _userHandle) {

      if (!value) { _userHandle = undefined; }
   }

   if (value && type && type.isOfType(UserType)) { _userHandle = handle; }
});


(function () {
   var target = dmz.defs.createNamedHandle("dmzQtPluginLoginDialog")
     , doLoginMessage = dmz.message.create("LoginRequiredMessage")
     ;

   doLoginMessage.send(target);
}());

