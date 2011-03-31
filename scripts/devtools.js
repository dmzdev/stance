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
   , dock = dmz.ui.mainWindow.createDock
     (DockName
     , { area: dmz.ui.consts.RightToolBarArea
       , allowedAreas: [dmz.ui.consts.LeftToolBarArea, dmz.ui.consts.RightToolBarArea]
       , floating: true
       , visible: true
       }
     , form
     )

   // DMZ variables
   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , LogoutMessage = dmz.message.create("Logout_Message")
   , TimeStampAttr = dmz.defs.createNamedHandle("time-stamp")

   // Variables

   , UserList = []
   ;

self.shutdown = function () { dmz.ui.mainWindow.removeDock(DockName); };

dmz.object.create.observe(self, function (handle, objType) {

   if (objType) {

      if (objType.isOfType(dmz.stance.UserType)) {

         list.addItem(dmz.object.text(handle, dmz.stance.NameHandle))
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
        , hil
        ;

      if (selected) {

         LogoutMessage.send();

         handle = selected.data();
         username = selected.text();

         data = dmz.data.create();

         data.string(dmz.stance.NameHandle, 0, username);
         data.number(TimeStampAttr, 0, Date.now()/1000);

         self.log.warn(">>> Faking login for: " + username + " <<<");
         LoginSuccessMessage.send(data);
      }
   });

   form.show();
}());

