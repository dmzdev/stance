var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , util: require("dmz/types/util")
       , const: require("const")
       , ui:
          { consts: require('dmz/ui/consts')
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          , list: require("dmz/ui/listWidget")
          , widget: require("dmz/ui/widget")
          }
       }

   // UI elements
   , form = dmz.ui.loader.load("DevTools.ui")
   , list = form.lookup("listWidget")
//   , admin = form.lookup("adminCheckBox")

   // Handles
   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")
   , NameHandle = dmz.defs.createNamedHandle("name")
   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , LogoutMessage = dmz.message.create("Logout_Message")
   , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")

   // Object Types
   , GroupType = dmz.objectType.lookup("group")
   , UserType = dmz.objectType.lookup("user")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables

   , CurrentUser = false
   , UserList = []

   // Test Function decls
   ;


dmz.object.create.observe(self, function (handle, objType) {

   var parent = false
     , parentLinks
     , parent
     , child
     , text
     ;

   if (objType) {

      if (objType.isOfType(UserType)) {

         list.addItem(dmz.object.text(handle, NameHandle), handle);
         UserList.push(handle);
      }
   }
});


(function () {

   form.observe(self, "setUserButton", "clicked", function () {

      var selected = list.currentItem()
        , handle
        , username
        , data
        ;

      if (selected) {

         LogoutMessage.send();

         handle = selected.data();
         username = selected.text();

         data = dmz.data.create();

         data.string(dmz.const.NameHandle, 0, username);
//         data.boolean("admin", 0, admin.isChecked());
         data.number(TimeStampAttr, 0, Date.now()/1000);

         self.log.warn(">>> Faking login for: " + username + " <<<");
         LoginSuccessMessage.send(data);

//         UserList.forEach(function (handle) {

//            dmz.object.flag(handle, dmz.object.HILAttribute, handle === data);
//         });
      }
   });
   form.show();
}());

