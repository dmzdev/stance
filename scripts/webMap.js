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
   , newPinDialog = dmz.ui.loader.load("MapAddPinDialog.ui")
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
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , MessageQueue = []

   // Function decls
   , onPinAdded
   , onPinRemoved
   , populateMapFromGroup
   ;


self.shutdown = function () { if (map) { map.removeEventFilter(); } }

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

         if (!PinData[objHandle] && dmz.object.flag(objHandle, dmz.stance.PinActiveHandle)) {

            pos = dmz.object.position(objHandle, dmz.stance.PinPositionHandle);
            title = dmz.object.text(objHandle, dmz.stance.PinTitleHandle);
            description = dmz.object.text(objHandle, dmz.stance.PinDescHandle);
            file = dmz.object.text(objHandle, dmz.stance.PinFileHandle);

            data = dmz.data.create();
            data.number(dmz.stance.PinPositionHandle, 0, pos.x);
            data.number(dmz.stance.PinPositionHandle, 1, pos.y);
            data.string(dmz.stance.PinTitleHandle, 0, title);
            data.string(dmz.stance.PinDescHandle, 0, description);
            data.string(dmz.stance.PinFileHandle, 0, file);
            data.number(dmz.stance.PinObjectHandle, 0, objHandle);
            PinData[objHandle] = data;
         }
      }
      else if (objType.isOfType(dmz.stance.GroupType)) { GroupQueue[objHandle] = true; }
   }
});

dmz.object.position.observe(self, dmz.stance.PinPositionHandle, function (handle, attr, value, prev) {

   var data;
   if (!prev || ((value.x !== prev.x) && (value.y !== prev.y))) {

      if (PinHandleList[handle]) {

         data = PinData[handle];
         if (data) {

            data.number(dmz.stance.PinIDHandle, 0, PinHandleList[handle].id);
            data.number(dmz.stance.PinPositionHandle, 0, value.x);
            data.number(dmz.stance.PinPositionHandle, 1, value.y);
            if (HaveActivatedMap) { movePinMessage.send(data); }
            else { MessageQueue.push({ msg: movePinMessage, data: data }); }
         }
      }
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

onPinAdded = function (data) {

   var id
     , x
     , y
     , title
     , description
     , file
     , pinHandle
     , idx
     , count
     , list
     ;

   if (dmz.data.isTypeOf(data)) {

      id = data.number(dmz.stance.PinIDHandle, 0);
      x = data.number(dmz.stance.PinPositionHandle, 0);
      y = data.number(dmz.stance.PinPositionHandle, 1);
      title = data.string(dmz.stance.PinTitleHandle, 0);
      description = data.string(dmz.stance.PinDescHandle, 0);
      file = data.string(dmz.stance.PinFileHandle, 0);
      pinHandle = data.number(dmz.stance.PinObjectHandle, 0);
      count = data.number(dmz.stance.PinGroupCountHandle, 0);
      list = [];
      for (idx = 0; idx < count; idx += 1) {

         list.push(data.number(dmz.stance.GroupPinHandle, idx));
      }

      if (!pinHandle) {

         pinHandle = dmz.object.create(dmz.stance.PinType);
         PinIDList[id] = { id: id, handle: pinHandle };
         PinHandleList[pinHandle] = PinIDList[id];
         dmz.object.position(pinHandle, dmz.stance.PinPositionHandle, [x, y, 0]);
         dmz.object.text(pinHandle, dmz.stance.PinTitleHandle, title);
         dmz.object.text(pinHandle, dmz.stance.PinDescHandle, description);
         dmz.object.text(pinHandle, dmz.stance.PinFileHandle, file);
         dmz.object.flag(pinHandle, dmz.stance.PinActiveHandle, true);
         dmz.object.timeStamp(pinHandle, dmz.stance.CreatedAtServerTimeHandle, dmz.time.getFrameTime());
         PinData[pinHandle] = data;
         list.forEach(function (handle) {

            var type
              ;

            if (handle && dmz.object.isObject(handle)) {

               type = dmz.object.type(handle);
               if (type && type.isOfType(dmz.stance.GroupType) &&
                  !dmz.object.linkHandle(dmz.stance.GroupPinHandle, handle, pinHandle)) {

                  dmz.object.link(dmz.stance.GroupPinHandle, handle, pinHandle);
               }
            }
         });
         dmz.object.activate(pinHandle);
      }
      else {

         PinIDList[id] = { id: id, handle: pinHandle };
         PinHandleList[pinHandle] = PinIDList[id];
         PinData[pinHandle].number(dmz.stance.PinIDHandle, 0, id);
      }
   }
}

onPinRemoved = function (data) {

   var id
     , handle
     ;
   if (dmz.data.isTypeOf(data)) {

      id = data.number(dmz.stance.PinIDHandle, 0);
      if (PinIDList[id]) {

         handle = PinIDList[id].handle;
         dmz.object.flag(handle, dmz.stance.PinActiveHandle, false);
         delete PinHandleList[handle];
         delete PinIDList[id];
      }
   }
}

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
                       ;

                     if (value) {

                        title = titleEdit.text();
                        desc = descEdit.text();

                        data = dmz.data.create();
                        data.number(dmz.stance.PinPositionHandle, 0, x);
                        data.number(dmz.stance.PinPositionHandle, 1, y);
                        data.string(dmz.stance.PinTitleHandle, 0, title ? title : " ");
                        data.string(dmz.stance.PinDescHandle, 0, desc ? desc : " ");
                        data.string(dmz.stance.PinFileHandle, 0, PinIconList[typeList.currentIndex()].webfile);
                        data.number(dmz.stance.PinObjectHandle, 0, 0);

                        for (idx = 0, indexCounter = 0; idx < count; idx += 1) {

                           if (groupFLayout.at(idx, 1).isChecked()) {

                              data.number(dmz.stance.GroupPinHandle, indexCounter++, GroupHandleList[idx]);
                           }
                        }

                        if (HaveActivatedMap) { addPinMessage.send(data); }
                        else { MessageQueue.push({ msg: addPinMessage, data: data }); }
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
   pinAddedMessage.subscribe(self, onPinAdded);
   pinRemovedMessage.subscribe(self, onPinRemoved);
   pinMovedMessage.subscribe(self, function (data) {

      var id
        , x
        , y
        , data
        ;

      if (dmz.data.isTypeOf(data)) {

        id = data.number(dmz.stance.PinIDHandle, 0);
        x = data.number(dmz.stance.PinPositionHandle, 0);
        y = data.number(dmz.stance.PinPositionHandle, 1);

        if (PinIDList[id]) {

           if (dmz.object.flag(dmz.object.hil(), dmz.stance.AdminHandle)) {

              dmz.object.position(PinIDList[id].handle, dmz.stance.PinPositionHandle, [x, y, 0]);
           }
        }
      }
   });
   pinSelectedMessage.subscribe(self, function (data) {

      var id
        , x
        , y
        ;

      if (dmz.data.isTypeOf(data)) {

        id = data.number(dmz.stance.PinIDHandle, 0);

        if (PinIDList[id]) {

           CurrentPinID = id;
//           self.log.warn ("Selected:", id, PinIDList[id].handle);
        }
      }
   });
}());

dmz.object.link.observe(self, dmz.stance.GroupPinHandle,
function (linkObjHandle, attrHandle, groupHandle, pinHandle) {

   var hil = dmz.object.hil()
     , list = dmz.object.subLinks(groupHandle, dmz.stance.GroupPinHandle)
     , count
     , data = PinData[pinHandle]
     ;

   if (data && (dmz.stance.getUserGroupHandle(hil) === groupHandle)) {

      count = dmz.object.scalar(hil, dmz.stance.PinCountHandle);
      count = count ? count : 0;
      list = list ? list.length : 0;
      if (!dmz.object.flag(hil, dmz.stance.AdminHandle) && (count < list)) {

         MainModule.highlight("Map");
      }
      if (HaveActivatedMap) { addPinMessage.send(data); }
      else { MessageQueue.push({ msg: addPinMessage, data: data }); }
   }
});

dmz.object.flag.observe(self, dmz.stance.VisibleHandle, function (handle, attr, value) {

   var type = dmz.object.type(handle)
     , data = PinData[handle]
     , hilGroup
     , id
     ;

   if (data) {

      if (value) {

         hilGroup = dmz.stance.getUserGroupHandle(dmz.object.hil());
         if (dmz.object.linkHandle(dmz.stance.GroupPinHandle, hilGroup, handle)) {

            if (HaveActivatedMap) { addPinMessage.send(data); }
            else { MessageQueue.push({ msg: addPinMessage, data: data }); }
         }
      }
      else {

         if (HaveActivatedMap) { removePinMessage.send(data); }
         else { MessageQueue.push({ msg: removePinMessage, data: data }); }
      }
   }
});

populateMapFromGroup = function (groupHandle) {

   var list = dmz.object.subLinks(groupHandle, dmz.stance.GroupPinHandle)
     ;

   if (groupHandle) {

      list = list ? list : [];
      Object.keys(PinData).forEach(function (pinHandle) {

         pinHandle = parseInt(pinHandle);
         if (pinHandle) {

            dmz.object.flag(
               pinHandle,
               dmz.stance.VisibleHandle,
               (list.indexOf(pinHandle) !== -1));
         }
      });
   }
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var count
     , list
     ;

   if (value) {

      list = dmz.object.subLinks(dmz.stance.getUserGroupHandle(objHandle), dmz.stance.GroupPinHandle);
      list = list ? list.length : 0;
      count = dmz.object.scalar(objHandle, dmz.stance.PinCountHandle);
      count = count ? count : 0;
      if (!dmz.object.flag(objHandle, dmz.stance.AdminHandle) && (count < list)) {

         MainModule.highlight("Map");
      }

      populateMapFromGroup(dmz.stance.getUserGroupHandle(objHandle));
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, userHandle) {

   var count
     , list
     ;

   if (userHandle === dmz.object.hil()) {

      list = dmz.object.subLinks(groupHandle, dmz.stance.GroupPinHandle);
      list = list ? list.length : 0;
      count = dmz.object.scalar(userHandle, dmz.stance.PinCountHandle);
      count = count ? count : 0;
      if (!dmz.object.flag(userHandle, dmz.stance.AdminHandle) && (count < list)) {

         MainModule.highlight("Map");
      }

      populateMapFromGroup(groupHandle);
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

            list = dmz.object.subLinks(hilGroup, dmz.stance.GroupPinHandle);
            list = list ? list.length : 0;
            dmz.object.scalar(hil, dmz.stance.PinCountHandle, list);
         }
      };

      list = MainModule.list;
      MainModule = module;
      module.addPage("Map", map, mapClickFn, mapHomeFn);
      setWebViewMessage.send();
//      page = map.page();
//      page.mainFrame().load(self.config.string("url.name"));
//      page.linkDelegation(dmz.ui.webview.DelegateAllLinks);

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
