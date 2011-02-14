var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
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

   // Handles
   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")

   , UserRealNameHandle = dmz.defs.createNamedHandle("user_real_name")

   // Devtools type, handle
   , CurrentUserHandle = dmz.defs.createNamedHandle("current_user")
   , CurrentUserType = dmz.objectType.lookup("current_user")

   // Object Types
   , GroupType = dmz.objectType.lookup("group")
   , UserType = dmz.objectType.lookup("user")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables

   , CurrentUser = false

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

         list.addItem(dmz.object.text(handle, UserRealNameHandle), handle);
      }
   }
});


(function () {

   CurrentUser = dmz.object.create(CurrentUserType);
   dmz.object.activate(CurrentUser);

   form.observe(self, "setUserButton", "clicked", function () {

      var selected = list.currentItem()
        , data
        ;
      if (selected) {

         data = selected.data();
         dmz.object.unlinkSubObjects(CurrentUser, CurrentUserHandle);
         self.log.warn (dmz.object.link(CurrentUserHandle, CurrentUser, data));
      }
   });
   form.show();
}());

