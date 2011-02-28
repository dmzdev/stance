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
          , graph: require("dmz/ui/graph")
          , layout: require("dmz/ui/layout")
          , label: require("dmz/ui/label")
          , button: require("dmz/ui/button")
          , widget: require("dmz/ui/widget")
          }
       }

   // UI elements
   , map = dmz.ui.webview.create()
   , newPinDialog = dmz.ui.loader.load("MapAddPinDialog.ui")
   , typeList = newPinDialog.lookup("typeList")
   , descEdit = newPinDialog.lookup("descEdit")
   , titleEdit = newPinDialog.lookup("titleEdit")
   , groupFLayout = newPinDialog.lookup("groupFLayout")

   // Handles
   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")

   , UserRealNameHandle = dmz.defs.createNamedHandle("user_real_name")
   , UserAuthoredPostLinkHandle = dmz.defs.createNamedHandle("user_authored_post_link")
   , UserReadPostLinkHandle = dmz.defs.createNamedHandle("user_read_post_link")

   , pinIDHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.id.name"))
   , pinPositionHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.position.name"))
   , pinTitleHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.title.name"))
   , pinDescHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.description.name"))
   , pinFileHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.file.name"))
   , pinActiveHandle = dmz.defs.createNamedHandle("Pin_Active")
   , pinObjectHandle = dmz.defs.createNamedHandle(self.config.string("pin-handles.object-handle.name"))

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
   , PinIconList = []
   , PinQueue = []
   , HaveActivatedMap = false

   // Function decls
   , onPinAdded
   , onPinRemoved
   ;

dmz.object.create.observe(self, function (objHandle, objType) {

   var id
     , pos
     , title
     , description
     , file
     , data
     , layout
     , widget
     , button
     , label
     ;

   if (objType) {

      if (objType.isOfType(PinType)) {

         if (!PinHandleList[objHandle] && dmz.object.flag(objHandle, pinActiveHandle)) {

            pos = dmz.object.position(objHandle, pinPositionHandle);
            title = dmz.object.text(objHandle, pinTitleHandle);
            description = dmz.object.text(objHandle, pinDescHandle);
            file = dmz.object.text(objHandle, pinFileHandle);
            self.log.warn (pos, title, description, file, objHandle);

            data = dmz.data.create();
            data.number(pinPositionHandle, 0, pos.x);
            data.number(pinPositionHandle, 1, pos.y);
            data.string(pinTitleHandle, 0, title);
            data.string(pinDescHandle, 0, description);
            data.string(pinFileHandle, 0, file);
            data.number(pinObjectHandle, 0, objHandle);
            if (!HaveActivatedMap) { PinQueue.push(data); }
            else { addPinMessage.send(data); }
         }
      }
      else if (objType.isOfType(GroupType)) {

         button = dmz.ui.button.createCheckBox();
         button.observe(self, "toggled", function (checked) {

            self.log.warn ("Toggled!");
         });
         groupFLayout.addRow(dmz.object.text(objHandle, GroupNameHandle), button);
      }
   }
});

onPinAdded = function (data) {

   var id
     , x
     , y
     , title
     , description
     , file
     , pinHandle
     ;

   if (dmz.data.isTypeOf(data)) {

      id = data.number(pinIDHandle, 0);
      x = data.number(pinPositionHandle, 0);
      y = data.number(pinPositionHandle, 1);
      title = data.string(pinTitleHandle, 0);
      description = data.string(pinDescHandle, 0);
      file = data.string(pinFileHandle, 0);
      pinHandle = data.number(pinObjectHandle, 0);

      if (!pinHandle) {

         self.log.warn ("Create object");
         pinHandle = dmz.object.create(PinType);
         PinIDList[id] = { id: id, handle: pinHandle };
         PinHandleList[pinHandle] = PinIDList[id];
         dmz.object.position(pinHandle, pinPositionHandle, [x, y, 0]);
         dmz.object.text(pinHandle, pinTitleHandle, title);
         dmz.object.text(pinHandle, pinDescHandle, description);
         dmz.object.text(pinHandle, pinFileHandle, file);
         dmz.object.flag(pinHandle, pinActiveHandle, true);
         dmz.object.activate(pinHandle);
      }
      else {

         PinIDList[id] = { id: id, handle: pinHandle };
         PinHandleList[pinHandle] = PinIDList[id];
      }
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

// Dialog setup
(function () {

   var iconList = self.config.get("icon-type.icon")
     , directory = self.config.string("icon-type.path")
     ;

   if (iconList) {

      iconList.forEach(function (icon) {

         var name = icon.string("name")
           , file = icon.string("file")
           , webfile = icon.string("webfile")
           , data
           ;

         if (!file) { file = "jake-sm.png"; }

         file = directory + file;
         file = dmz.ui.graph.createPixmap(file);
         data = { name: name, pixmap: file, webfile: webfile };
         PinIconList.push(data);
         typeList.addItem (file, name);
      });

      typeList.currentIndex(0);
   }
}());

// Map setup
(function () {

   map.contextMenuPolicy(dmz.ui.consts.NoContextMenu);
   map.name(self.config.string("webview.name"));
   map.eventFilter(self, function (object, event) {

      var type = event.type()
        , x
        , y
        ;

      if (type == dmz.ui.event.MouseButtonPress) {

         if (event.button() === dmz.ui.consts.RightButton) {

            x = event.x();
            y = event.y();
            newPinDialog.open(self, function (value, dialog) {

               var data
                 , title
                 , desc
                 , count
                 , widget
                 ;

               if (value) {

                  title = titleEdit.text();
                  desc = descEdit.text();

                  data = dmz.data.create();
                  data.number(pinPositionHandle, 0, x);
                  data.number(pinPositionHandle, 1, y);
                  data.string(pinTitleHandle, 0, title ? title : "");
                  data.string(pinDescHandle, 0, desc ? desc : "");
                  data.string(pinFileHandle, 0, PinIconList[typeList.currentIndex()].webfile);
                  data.number(pinObjectHandle, 0, 0);
                  addPinMessage.send(data);
               }

               titleEdit.clear();
               descEdit.clear();
            });
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

      module.addPage("Map", map, function () {

         if (!HaveActivatedMap) {

            HaveActivatedMap = true;
            while (PinQueue.length) {
               var data = PinQueue.pop();
               self.log.warn (data);
               addPinMessage.send(data);
//               addPinMessage.send(PinQueue.pop ());
            }
         }
      });
      setWebViewMessage.send();
      map.page().mainFrame().load(self.config.string("url.name"));
   }
});
