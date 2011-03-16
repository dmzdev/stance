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
       , const: require("const")
       }

   // UI elements
   , form = dmz.ui.loader.load("DevTools.ui")
   , list = form.lookup("listWidget")
   , groups = form.lookup("groupList")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables

   , CurrentUser = false
   , UserList = []
   , GroupList = [-1]

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

      if (objType.isOfType(dmz.const.UserType)) {

         list.addItem(dmz.const._getDisplayName(handle), handle);
         UserList.push(handle);
      }
      else if (objType.isOfType(dmz.const.GroupType)) {

         GroupList.push(handle);
         groups.addItem(dmz.const._getDisplayName(handle));
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
         groups.currentIndex(0); // Not bothering to look up
      }
   });

   groups.addItem("None");
   groups.observe(self, "currentIndexChanged", function (index) {

      var hil = dmz.object.hil();
      self.log.warn ("currItemChanged:", hil, dmz.const.AdminFlagHandle);
      if (hil && dmz.object.flag(hil, dmz.const.AdminFlagHandle)) {

         self.log.warn ("admin", index, GroupList.length);
         dmz.object.unlinkSuperObjects(hil, dmz.const.GroupMembersHandle);
         if (index && (index < GroupList.length)) {

            self.log.warn ("linking");
            dmz.object.link(dmz.const.GroupMembersHandle, GroupList[index], hil);
            dmz.object.flag(hil, dmz.object.HILAttribute, false);
            dmz.object.flag(hil, dmz.object.HILAttribute, true);
         }
      }
   });

   form.show();
}());

