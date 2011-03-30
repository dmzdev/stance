var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , util: require("dmz/types/util")
       , stance: require("stanceConst")
       , ui:
          { consts: require('dmz/ui/consts')
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          , list: require("dmz/ui/listWidget")
          , widget: require("dmz/ui/widget")
          , dock: require("dmz/ui/dockWidget")
          }
       }

   // UI elements
   , DockName = "Dev Tools"
   , form = dmz.ui.loader.load("DevTools.ui")
   , list = form.lookup("listWidget")
   , groups = form.lookup("groupList")
   , dock = dmz.ui.mainWindow.createDock
     (DockName
     , { area: dmz.ui.consts.RightToolBarArea
       , allowedAreas: [dmz.ui.consts.LeftToolBarArea, dmz.ui.consts.RightToolBarArea]
       , floating: true
       , visible: true
       }
     , form
     )


   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , LogoutMessage = dmz.message.create("Logout_Message")
   , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")

   // Object Lists
   , ForumList = {}
   , PostList = {}

   // Variables

   , CurrentUser = false
   , UserList = []
   , GroupList = [-1]

   // Test Function decls
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); };

dmz.object.create.observe(self, function (handle, objType) {

   var parent = false
     , parentLinks
     , parent
     , child
     , text
     ;

   if (objType) {

      if (objType.isOfType(dmz.stance.UserType)) {

         list.addItem(dmz.object.text(handle, dmz.stance.NameHandle))
         UserList.push(handle);
      }
      else if (objType.isOfType(dmz.stance.GroupType)) {

         GroupList.push(handle);
         groups.addItem(dmz.stance.getDisplayName(handle));
      }
   }
});


(function () {

   form.observe(self, "setUserButton", "clicked", function () {

      var selected = list.currentItem()
        , handle
        , username
        , data
        , hil
        ;

      if (selected) {

         LogoutMessage.send();

         handle = selected.data();
         username = selected.text();

         data = dmz.data.create();

         data.string(dmz.stance.NameHandle, 0, username);
//         data.boolean("admin", 0, admin.isChecked());
         data.number(TimeStampAttr, 0, Date.now()/1000);

         self.log.warn(">>> Faking login for: " + username + " <<<");
         LoginSuccessMessage.send(data);

//         UserList.forEach(function (handle) {

//            dmz.object.flag(handle, dmz.object.HILAttribute, handle === data);
//         });
         groups.currentIndex(0); // Not bothering to look up
      }
   });

   groups.addItem("None");
   groups.observe(self, "currentIndexChanged", function (index) {

      var hil = dmz.object.hil();
      self.log.warn ("currItemChanged:", hil, dmz.stance.AdminFlagHandle);
      if (hil && dmz.object.flag(hil, dmz.stance.AdminFlagHandle)) {

         self.log.warn ("admin", index, GroupList.length);
         dmz.object.unlinkSuperObjects(hil, dmz.stance.GroupMembersHandle);
         if (index && (index < GroupList.length)) {

            self.log.warn ("linking");
            dmz.object.link(dmz.stance.GroupMembersHandle, GroupList[index], hil);
            dmz.object.flag(hil, dmz.object.HILAttribute, false);
            dmz.object.flag(hil, dmz.object.HILAttribute, true);
         }
      }
   });

   form.show();
}());

