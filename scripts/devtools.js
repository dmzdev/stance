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

   , NameHandle = dmz.defs.createNamedHandle("name")

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
        , data
        , hil
        ;
      if (selected) {

         data = selected.data();
         UserList.forEach(function (handle) {

            dmz.object.flag(handle, dmz.object.HILAttribute, handle === data);
         });
      }
   });
   form.show();
}());

