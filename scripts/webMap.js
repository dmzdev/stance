var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , stance: require("stanceConst")
       , data: require("dmz/runtime/data")
       , defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , message: require("dmz/runtime/messaging")
       , resources: require("dmz/runtime/resources")
       , time: require("dmz/runtime/time")
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
   , newPinDialog = dmz.ui.loader.load("MapAddPinDialog.ui", dmz.ui.mainWindow.centralWidget())
   , typeList = newPinDialog.lookup("typeList")
   , descEdit = newPinDialog.lookup("descEdit")
   , titleEdit = newPinDialog.lookup("titleEdit")
   , groupFLayout = newPinDialog.lookup("groupFLayout")

   , browserDialog = dmz.ui.loader.load("BrowserDialog")
   , backButton = browserDialog.lookup("backButton")

   // Messages
   , addPinMessage = dmz.message.create(self.config.string("message-names.add.name"))
   , pinAddedMessage = dmz.message.create(self.config.string("message-names.add-confirm.name"))
   , removePinMessage = dmz.message.create(self.config.string("message-names.remove.name"))
   , pinRemovedMessage = dmz.message.create(self.config.string("message-names.remove-confirm.name"))
   , movePinMessage = dmz.message.create(self.config.string("message-names.move.name"))
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
   , GroupHandleList = []
   , PinGroupList = {}
   , GroupQueue = {}
   , PinData = {}


   , master = { pins: {} }
   , VisiblePins = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , MessageQueue = []

   // Function decls
   , onPinAdded
   , onPinRemoved
   , populateMapFromGroup

   , updatePosition
   , updateTitle
   , updateText
   , updateFile
   , updateActive

   , sendMessage
   ;


self.shutdown = function () { if (map) { map.removeEventFilter(); } }

sendMessage = function (message, handle) {

   var data = master.pins[handle]
     , msgData
     ;
   if (message && data && data.pos && data.title && data.text && data.picture) {

      msgData = dmz.data.create();
      msgData.number(dmz.stance.ObjectHandle, 0, handle);
      msgData.number(dmz.stance.PositionHandle, 0, data.pos[0]);
      msgData.number(dmz.stance.PositionHandle, 1, data.pos[1]);
      msgData.string(dmz.stance.TitleHandle, 0, data.title);
      msgData.string(dmz.stance.TextHandle, 0, data.text);
      msgData.string(dmz.stance.PictureHandle, 0, data.picture);

      message.send(msgData);
   };

}

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

      if (objType.isOfType(dmz.stance.PinType)) {

         master.pins[objHandle] = { handle: objHandle, active: false };
      }
      else if (objType.isOfType(dmz.stance.GroupType)) {

         GroupQueue[objHandle] = true;
      }
   }
});

dmz.object.position.observe(self, dmz.stance.PositionHandle, function (handle, attr, value, prev) {

   var data = master.pins[handle];
   if (data && (!prev || ((value.x !== prev.x) && (value.y !== prev.y)))) {

      data.position = value;
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle, attr, value) {

   var index;
   if (GroupQueue[handle]) {

     GroupHandleList.push(handle);
     groupFLayout.addRow(value, dmz.ui.button.createCheckBox());
     delete GroupQueue[handle];
   }
   else {

      index = GroupHandleList.indexOf(handle);
      if (index !== -1) { groupFLayout.at(index, 0).text(value); }
   }
});

// Dialog setup
(function () {

   var iconList = self.config.get("icon-type.icon")
     ;

   if (iconList) {

      iconList.forEach(function (icon) {

         var name = icon.string("name")
           , file = dmz.resources.findFile(name)
           , config = dmz.resources.lookupConfig(name)
           , webfile = (name + ".png")
           , data
           ;

         if (config) { webfile = config.string("webMap.file"); }

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

      var type
        , x
        , y
        ;

      if (event) {

         type = event.type();
         if (type == dmz.ui.event.MouseButtonPress) {

            if (event.button() === dmz.ui.consts.RightButton) {

               if (dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle)) {

                  x = event.x();
                  y = event.y();
                  newPinDialog.open(self, function (value, dialog) {

                     var data
                       , title
                       , desc
                       , count = groupFLayout.rowCount()
                       , widget
                       , idx
                       , indexCounter
                       , handle
                       ;

                     if (value) {

                        title = titleEdit.text();
                        desc = descEdit.text();

                        handle = dmz.object.create(dmz.stance.PinType);
                        PinHandleList[handle] = { handle: handle };
                        dmz.object.position(handle, dmz.stance.PositionHandle, [x, y, 0]);
                        dmz.object.text(handle, dmz.stance.TitleHandle, title);
                        dmz.object.text(handle, dmz.stance.TextHandle, desc);
                        dmz.object.text(handle, dmz.stance.PictureHandle, PinIconList[typeList.currentIndex()].webfile);
                        dmz.object.timeStamp(handle, dmz.stance.CreatedAtServerTimeHandle, 0);
                        dmz.object.flag(handle, dmz.stance.UpdateStartTimeHandle, true);
                        dmz.object.activate(handle);

                        for (idx = 0, indexCounter = 0; idx < count; idx += 1) {

                           if (groupFLayout.at(idx, 1).isChecked()) {

                              dmz.object.link(dmz.stance.GroupPinHandle, handle, GroupHandleList[idx]);
                           }
                        }

                        sendMessage(addPinMessage, handle);
                     }

                     titleEdit.clear();
                     descEdit.clear();
                     for (idx = 0; idx < count; idx += 1) {

                        groupFLayout.at(idx, 1).setChecked(false);
                     }
                  });
               }
            }
         }
      }
   });
//   pinAddedMessage.subscribe(self, onPinAdded);
//   pinRemovedMessage.subscribe(self, onPinRemoved);
   pinMovedMessage.subscribe(self, function (data) {

      var handle
        , x
        , y
        , data
        ;

      if (dmz.data.isTypeOf(data)) {

        handle = data.number(dmz.stance.ObjectHandle, 0);
        x = data.number(dmz.stance.PositionHandle, 0);
        y = data.number(dmz.stance.PositionHandle, 1);

         if (dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle)) {

            dmz.object.position(handle, dmz.stance.PositionHandle, [x, y, 0]);
         }
      }
   });
//   pinSelectedMessage.subscribe(self, function (data) {

//      var id;
//      if (dmz.data.isTypeOf(data)) {

//        id = data.number(dmz.stance.ID, 0);
//        if (PinIDList[id]) { CurrentPinID = id; }
//      }
//   });
}());

//dmz.object.flag.observe(self, dmz.stance.ActiveHandle, function (handle, attr, value, prev) {

//   var data = master.pins[handle];
//   if (data) {

//      data.active = value;
//      updateActive(handle);
//   }
//});

dmz.object.link.observe(self, dmz.stance.GroupPinHandle,
function (linkObjHandle, attrHandle, pinHandle, groupHandle) {

   var hil = dmz.object.hil()
     , list = dmz.object.superLinks(groupHandle, dmz.stance.GroupPinHandle) || []
     , count
     ;

   if (dmz.stance.getUserGroupHandle(hil) === groupHandle) {

      count = dmz.object.scalar(hil, dmz.stance.PinTotalHandle) || 0;
      if (!dmz.object.flag(hil, dmz.stance.AdminHandle) && (count < list.length)) {

         MainModule.highlight("Map");
      }
   }
});

//dmz.object.flag.observe(self, dmz.stance.VisibleHandle, function (handle, attr, value) {

//   var type = dmz.object.type(handle)
//     , data = PinData[handle]
//     , hilGroup
//     , id
//     ;

//   if (data) {

//      if (value) {

//         hilGroup = dmz.stance.getUserGroupHandle(dmz.object.hil());
//         if (dmz.object.linkHandle(dmz.stance.GroupPinHandle, handle, hilGroup)) {

//            if (HaveActivatedMap) { addPinMessage.send(data); }
//            else { MessageQueue.push({ msg: addPinMessage, data: data }); }
//         }
//      }
//      else {

//         if (HaveActivatedMap) { removePinMessage.send(data); }
//         else { MessageQueue.push({ msg: removePinMessage, data: data }); }
//      }
//   }
//});

populateMapFromGroup = function (groupHandle) {

   var list = dmz.object.superLinks(groupHandle, dmz.stance.GroupPinHandle) || [];
   while (VisiblePins.length) { sendMessage(removePinMessage, VisiblePins.pop()); }
   list.forEach(function (handle) {

      VisiblePins.push(handle);
      sendMessage(addPinMessage, handle);
   });
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var count
     , list
     ;

   if (value) {

      list = dmz.object.superLinks(dmz.stance.getUserGroupHandle(objHandle), dmz.stance.GroupPinHandle) || [];
      count = dmz.object.scalar(objHandle, dmz.stance.PinTotalHandle) || 0;
      if (!dmz.object.flag(objHandle, dmz.stance.AdminHandle) && (count < list.length)) {

         MainModule.highlight("Map");
      }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var mapClickFn
     , mapHomeFn
     , list
     , page
     , browser
     ;


   if (Mode === dmz.module.Activate) {

      mapClickFn = function () {

         if (!HaveActivatedMap) {

            page = map.page();
            page.mainFrame().load(self.config.string("url.name"));
            page.linkDelegation(dmz.ui.webview.DelegateAllLinks);
            map.observe(self, "loadFinished", function (done) {

               if (done) {

                  MessageQueue.forEach(function (dataObj) {

                     if (dataObj.msg && dataObj.data) { dataObj.msg.send(dataObj.data); }
                  });
                  HaveActivatedMap = true;
                  populateMapFromGroup(dmz.stance.getUserGroupHandle(dmz.object.hil()));
               }
            });
         }
      };

      mapHomeFn = function () {

         var hil = dmz.object.hil()
           , hilGroup = dmz.stance.getUserGroupHandle(hil)
           , list
           ;

         if (hilGroup) {

            list = dmz.object.superLinks(hilGroup, dmz.stance.GroupPinHandle) || [];
            dmz.object.scalar(hil, dmz.stance.PinTotalHandle, list.length);
         }
      };

      list = MainModule.list;
      MainModule = module;
      module.addPage("Map", map, mapClickFn, mapHomeFn);
      setWebViewMessage.send();

      browser = dmz.ui.webview.create();
      browserDialog.lookup("verticalLayout").addWidget(browser);
      browserDialog.observe(self, "backButton", "clicked", browser.back);
      browserDialog.observe(self, "forwardButton", "clicked", browser.forward);
      map.observe(self, "linkClicked", function (urlString) {

         // Open browser dialog.
         browser.page().mainFrame().load(urlString);
         browserDialog.open(self, function () {});
      });
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});
