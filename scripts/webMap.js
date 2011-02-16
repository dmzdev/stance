var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , data: require("dmz/runtime/data")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , message: require("dmz/runtime/messaging")
       , ui:
          { consts: require('dmz/ui/consts')
          , event: require("dmz/ui/event")
          , loader: require('dmz/ui/uiLoader')
          , mainWindow: require('dmz/ui/mainWindow')
          , messageBox: require("dmz/ui/messageBox")
          , webview: require("dmz/ui/webView")
          }
       }

   // UI elements
   , map = dmz.ui.webview.create()

   // Handles
   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")

   , UserRealNameHandle = dmz.defs.createNamedHandle("user_real_name")
   , UserAuthoredPostLinkHandle = dmz.defs.createNamedHandle("user_authored_post_link")
   , UserReadPostLinkHandle = dmz.defs.createNamedHandle("user_read_post_link")

   , pinIDHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.id.name"))
   , pinPositionHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.position.name"))
   , pinTitleHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.title.name"))
   , pinDescHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.description.name"))
   , pinActiveHandle = dmz.defs.createNamedHandle("Pin_Active")

   // Devtools type
   , CurrentUserHandle = dmz.defs.createNamedHandle("current_user")
   , CurrentUserType = dmz.objectType.lookup("current_user")

   // Object Types
   , GroupType = dmz.objectType.lookup("group")
   , UserType = dmz.objectType.lookup("user")
   , PinType = dmz.objectType.lookup("map_push_pin")

   // Messages
   , addPinMessage = dmz.message.create(self.config.string("message-names.add.name"))
   , pinAddedMessage = dmz.message.create(self.config.string("message-names.add-confirm.name"))
   , removePinMessage = dmz.message.create(self.config.string("message-names.remove.name"))
   , pinRemovedMessage = dmz.message.create(self.config.string("message-names.remove-confirm.name"))
   , pinMovedMessage = dmz.message.create(self.config.string("message-names.moved.name"))
   , setWebViewMessage = dmz.message.create(self.config.string("message-names.set-interface.name"))
   , pinSelectedMessage = dmz.message.create(self.config.string("message-names.selected.name"))

   // Variables
   , CurrentUser = false
   , PinIDList = {}
   , PinHandleList = {}
   , CurrentPinID = -1

   // Function decls
   , onPinAdded
   , onPinRemoved
   ;

dmz.object.create.observe(self, function (objHandle, objType) {

   var id
     , pos
     , title
     , description
     ;
   if (objType && objType.isOfType(PinType)) {

      if (!PinHandleList[objHandle] && dmz.object.flag(objHandle, pinActiveHandle)) {

         id = dmz.object.scalar(pinHandle, pinIDHandle);
         pos = dmz.object.position(pinHandle, pinPositionHandle);
         title = dmz.object.string(pinHandle, pinTitleHandle);
         description = dmz.object.string(pinHandle, pinDescHandle);

         data = dmz.data.create();
         data.number(pinPositionHandle, 0, pos.x);
         data.number(pinPositionHandle, 1, pos.y);
         data.string(pinTitleHandle, 0, title);
         data.string(pinDescHandle, 0, description);
         addPinMessage.send(data);
      }
   }
});

onPinAdded = function (data) {

   var id
     , x
     , y
     , title
     , description
     , pinHandle
     ;

   if (dmz.data.isTypeOf(data)) {

      id = data.number(pinIDHandle, 0);
      x = data.number(pinPositionHandle, 0);
      y = data.number(pinPositionHandle, 1);
      title = data.string(pinTitleHandle, 0);
      description = data.string(pinDescHandle, 0);

      pinHandle = dmz.object.create(PinType);
      PinIDList[id] = { id: id, handle: pinHandle };
      PinHandleList[pinHandle] = PinIDList[id];
      dmz.object.scalar(pinHandle, pinIDHandle, id);
      dmz.object.position(pinHandle, pinPositionHandle, [x, y, 0]);
      dmz.object.text(pinHandle, pinTitleHandle, title);
      dmz.object.text(pinHandle, pinDescHandle, description);
      dmz.object.flag(pinHandle, pinActiveHandle, true);
      dmz.object.activate(pinHandle);
   }
}

onPinRemoved = function (data) {

   var id
     , handle
     ;
   if (dmz.data.isTypeOf(data)) {

      id = data.number(pinIDHandle, 0);
      if (PinIDList[id]) {

         handle = PinIDList[id].handle;
         dmz.object.flag(handle, pinActiveHandle, false);
         delete PinHandleList[handle];
         delete PinIDList[id];
      }
   }
}

(function () {

   map.contextMenuPolicy(dmz.ui.consts.NoContextMenu);
   map.name(self.config.string("webview.name"));
   map.eventFilter(self, function (object, event) {

      var type = event.type()
        , data
        ;
      if (type == dmz.ui.event.MouseButtonPress) {

         if (event.button() === dmz.ui.consts.RightButton) {

            // Replace this section with code that opens a dialog window which
            // contains a drop-down menu, title, and description area.
            // When that closes, it should send this message out with the modified data
            self.log.warn ("Right mouse click!");
            data = dmz.data.create();
            data.number(pinPositionHandle, 0, event.x());
            data.number(pinPositionHandle, 1, event.y());
            data.string(pinTitleHandle, 0, "Some title");
            data.string(pinDescHandle, 0, "Some description.");
            addPinMessage.send(data);
         }
      }
   });
   pinAddedMessage.subscribe(self, onPinAdded);
   pinRemovedMessage.subscribe(self, onPinRemoved);
   pinMovedMessage.subscribe(self, function (data) {

      var id
        , x
        , y
        ;

      if (dmz.data.isTypeOf(data)) {

        id = data.number(pinIDHandle, 0);
        x = data.number(pinPositionHandle, 0);
        y = data.number(pinPositionHandle, 1);

        if (PinIDList[id]) {

           dmz.object.position(PinIDList[id].handle, pinPositionHandle, [x, y, 0]);
        }
      }

   });
   pinSelectedMessage.subscribe(self, function (data) {

      var id
        , x
        , y
        ;

      if (dmz.data.isTypeOf(data)) {

        id = data.number(pinIDHandle, 0);

        if (PinIDList[id]) {

           CurrentPinID = id;
           self.log.warn ("Selected:", id, PinIDList[id].handle);
        }
      }
   });

}());

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      module.addPage ("Map", map);
      setWebViewMessage.send();
      map.page().mainFrame().load(self.config.string("url.name"));
   }
});
