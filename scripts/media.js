var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , treeWidget: require("dmz/ui/treeWidget")
      , webview: require("dmz/ui/webView")
      , widget: require("dmz/ui/widget")
      }
   , stance: require("stanceConst")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , time: require("dmz/runtime/time")
   }

   // UI Elements
   , webForm = dmz.ui.loader.load("PrintMediaForm.ui")
   , lobbyistForm = dmz.ui.loader.load("LobbyistWindow.ui")

   // WebForm specific UI
   , webpage = dmz.ui.webview.create()

   // Lobbyist Specific UI
   , messageText = lobbyistForm.lookup("messageText")
   , nameLabel = lobbyistForm.lookup("nameLabel")
   , specialityLabel = lobbyistForm.lookup("specialityLabel")
   , pictureLabel = lobbyistForm.lookup("pictureLabel")

   // Shared UI
   , nextButton = webForm.lookup("nextButton") //
   , prevButton = webForm.lookup("prevButton") //
   , currLabel = webForm.lookup("currentLabel") //
   , totalLabel = webForm.lookup("totalLabel") //
   , unseenItemsLabel = webForm.lookup("unseenItemsLabel") //

   // Variables
   , dialogWidth = 0
   , dialogHeight = 0
   , CurrentWindowName
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , CurrentType
   , TypesMap =
        { "Memo": dmz.stance.MemoType
        , "Newspaper": dmz.stance.NewspaperType
        , "Video": dmz.stance.VideoType
        , "Lobbyist": dmz.stance.LobbyistType
        }
   // Function decls, "//" indicated shared functions with flow control base on
   // object type.
   , loadCurrentPrint
   , loadCurrentLobbyist
   , skipForward //
   , skipBackward //
   , setUserPlayList //
   , setCurrentType //
   , setActiveState //
   , setButtonBindings
   , checkNotifications
   , checkNotificationsOnHIL
   , init
   ;

setActiveState = function (state) {

   CurrentType = TypesMap[state];
   switch (state) {

      case ("Lobbyist"):

         nextButton = lobbyistForm.lookup("nextButton");
         prevButton = lobbyistForm.lookup("prevButton");
         currLabel = lobbyistForm.lookup("currentLabel");
         totalLabel = lobbyistForm.lookup("totalLabel");
         unseenItemsLabel = lobbyistForm.lookup("unseenItemsLabel");
         break;
      case ("Video"):

         nextButton = webForm.lookup("nextButton");
         prevButton = webForm.lookup("prevButton");
         currLabel = webForm.lookup("currentLabel");
         totalLabel = webForm.lookup("totalLabel");
         unseenItemsLabel = webForm.lookup("unseenItemsLabel");
         break;
      case ("Newspaper"):

         nextButton = webForm.lookup("nextButton");
         prevButton = webForm.lookup("prevButton");
         currLabel = webForm.lookup("currentLabel");
         totalLabel = webForm.lookup("totalLabel");
         unseenItemsLabel = webForm.lookup("unseenItemsLabel");
         break;
      case ("Memo"):

         nextButton = webForm.lookup("nextButton");
         prevButton = webForm.lookup("prevButton");
         currLabel = webForm.lookup("currentLabel");
         totalLabel = webForm.lookup("totalLabel");
         unseenItemsLabel = webForm.lookup("unseenItemsLabel");
         break;
   }

   setButtonBindings();
   CurrentWindowName = state;
};

setUserPlayList = function (userHandle) {

   var groupMediaList = dmz.object.superLinks(dmz.stance.getUserGroupHandle(userHandle), dmz.stance.MediaHandle)
     , userMediaList = dmz.object.superLinks(userHandle, dmz.stance.MediaHandle)
     , combinedMediaList = []
     , text
     , pic
     , name
     , title
     , itor
     ;

   SourceList = [];
   NewSource = true;
   totalLabel.text("0");
   currLabel.text("0");
   CurrentIndex = 0;

   if (groupMediaList) {

      groupMediaList = groupMediaList.filter(function (handle, index) {

         var type = dmz.object.type(handle);
         return type && type.isOfType(CurrentType) && dmz.object.flag(handle, dmz.stance.ActiveHandle);
      });
   }

   if (userMediaList && groupMediaList) {

      userMediaList = userMediaList.filter(function (handle, index) {

         var type = dmz.object.type(handle);
         return type && type.isOfType(CurrentType) && dmz.object.flag(handle, dmz.stance.ActiveHandle);
      });
      userMediaList.forEach(function (userMediaHandle) {

         var idx = groupMediaList.indexOf(userMediaHandle);
         if (idx !== -1) { groupMediaList.splice(idx, 1); }
      });
   }

   // At this point, userMediaList containts previously viewed items, while groupMediaList
   // contains items not yet seen by the user.
   if (groupMediaList && groupMediaList.length) {

      MainModule.highlight(CurrentWindowName);
   }

   if (groupMediaList) {

      for (itor = 0; itor < groupMediaList.length; itor += 1) {

         combinedMediaList.push(groupMediaList[itor]);
      }
   }
   if (userMediaList) {

      for (itor = 0; itor < userMediaList.length; itor += 1) {

         combinedMediaList.push(userMediaList[itor]);
      }
   }

   if (combinedMediaList && combinedMediaList.length) {

      /* Go through the combined media list and remove and objects that don't also
         belong to the user's current group (only a problem for admin users)
      */
      groupMediaList = dmz.object.superLinks(dmz.stance.getUserGroupHandle(userHandle), dmz.stance.MediaHandle);
      userMediaList = combinedMediaList;
      combinedMediaList = [];
      if (groupMediaList) {

         groupMediaList.forEach(function (handle) {

            if (userMediaList.indexOf(handle) !== -1) {

               combinedMediaList.push(handle);
            }
         });
      }

      /* Sort the list so the newest object is first */
      combinedMediaList.sort(function (obj1, obj2) {

         var result = dmz.object.scalar(obj2, dmz.stance.ID) - dmz.object.scalar(obj1, dmz.stance.ID);
         return result ? result : 0;
      });
      combinedMediaList.forEach(function (handle) {

         if (CurrentWindowName !== "Lobbyist") {

            text = dmz.object.text(handle, dmz.stance.TextHandle);
            if (text) {

               SourceList.push (
                  { handle: handle
                  , source: text
                  });
            }
         }
         if (CurrentWindowName === "Lobbyist") {

            pic = dmz.object.text(handle, dmz.stance.PictureHandle);
            name = dmz.object.text(handle, dmz.stance.NameHandle);
            title = dmz.object.text(handle, dmz.stance.TitleHandle);
            text = dmz.object.text(handle, dmz.stance.TextHandle);

            if (pic && name && title && text) {

               SourceList.push (
                  { handle: handle
                  , pic: pic
                  , name: name
                  , title: title
                  , text: text
                  });
            }
         }
      });
      totalLabel.text(SourceList.length);
      CurrentIndex = 0;
      if (SourceList.length !== 0) { currLabel.text(CurrentIndex + 1); }
   }
};

loadCurrentPrint = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     , unseen = 0
     ;

   if (!SourceList.length) { webpage.setHtml("<center><b>No Current Items</b></center>"); }

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.source) {

         if (NewSource) {

            if (CurrentWindowName === "Video") {

               /* timer is needed because otherwise the width and height settings are
                  not set in time for the load and default to 480x600
               */
               dmz.time.setTimer(self, function () {

                  webpage.page().mainFrame().load(
                     "http://www.chds.us/?stance:youtube&video=" + item.source +
                     "&width=" + (webpage.page().width() - 20) +"&height=" + (webpage.page().height() - 20));
               });
            }
            else { webpage.page().mainFrame().load(item.source); }
            NewSource = false;
            linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, item.handle, hil);
            if (!linkHandle) {

               dmz.object.link(dmz.stance.MediaHandle, item.handle, hil);
            }
            SourceList.forEach(function (mediaItem) {

               linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, mediaItem.handle, hil);
               if (!linkHandle) {

                  unseen += 1;
               }
            });
            unseenItemsLabel.text("Unseen Items: " + unseen + "/" + SourceList.length);
         }
      }
   }
};

loadCurrentLobbyist = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     , pic
     , unseen = 0
     ;

   if (SourceList.length === 0) {

      messageText.text("");
      nameLabel.text("");
      specialityLabel.text("");
      pictureLabel.clear();
   }

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.pic && item.title && item.text && item.name && item.handle) {

         if (NewSource) {

            messageText.text(item.text);
            nameLabel.text(item.name);
            specialityLabel.text(item.title);
            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(item.pic));
            if (pic) { pictureLabel.pixmap(pic); }

            NewSource = false;
            linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, item.handle, hil);
            if (!linkHandle) {

               dmz.object.link(dmz.stance.MediaHandle, item.handle, hil);
            }
            SourceList.forEach(function (mediaItem) {

               linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, mediaItem.handle, hil);
               if (!linkHandle) {

                  unseen += 1;
               }
            });
            unseenItemsLabel.text("Unseen Items: " + unseen + "/" + SourceList.length);
         }
      }
   }
};

skipForward = function () {

   if (CurrentIndex < SourceList.length) {

      if ((CurrentIndex + 1) < SourceList.length) {

         CurrentIndex += 1;
         NewSource = true;
         if (CurrentWindowName !== "Lobbyist") {

            loadCurrentPrint();
         }
         if (CurrentWindowName === "Lobbyist") {

            loadCurrentLobbyist();
         }
      }
      currLabel.text(CurrentIndex + 1);
   }
};

skipBackward = function () {

   if (CurrentIndex < SourceList.length) {

      if (CurrentIndex > 0) {

         CurrentIndex -= 1;
         NewSource = true;
         if (CurrentWindowName !== "Lobbyist") {

            loadCurrentPrint();
         }
         if (CurrentWindowName === "Lobbyist") {

            loadCurrentLobbyist();
         }
      }
      currLabel.text(CurrentIndex + 1);
   }
};

setButtonBindings = function () {

   nextButton.observe(self, "clicked", skipForward);
   prevButton.observe(self, "clicked", skipBackward);
};

checkNotifications = function () {

   var hil = dmz.object.hil()
     , groupHandle = dmz.stance.getUserGroupHandle(hil)
     , groupMediaHandles = dmz.object.superLinks(groupHandle, dmz.stance.MediaHandle) || []
     , userMediaHandles = dmz.object.superLinks(hil, dmz.stance.MediaHandle) || []
     , objType
     , active
     ;

   groupMediaHandles.forEach(function (mediaHandle) {

      if (userMediaHandles.indexOf(mediaHandle) === -1) {

         objType = dmz.object.type(mediaHandle);
         active = dmz.object.flag(mediaHandle, dmz.stance.ActiveHandle);
         Object.keys(TypesMap).forEach(function (key) {

            if (TypesMap[key].isOfType(objType) && active) {

               MainModule.highlight(key);
            }
         });
      }
   });
};

checkNotificationsOnHIL = function () {

   checkNotifications();
   // When object is created for a group, check its type and highlight if needed
   dmz.object.link.observe(self, dmz.stance.MediaHandle,
   function (linkHandle, attrHandle, mediaHandle, groupHandle) {

      var hil = dmz.object.hil()
        , type = dmz.object.type(groupHandle)
        ;
      // check that media is not disabled, not in user's list, and is in user's group
      // list, and user is in the group
      if (dmz.object.flag(mediaHandle, dmz.stance.ActiveHandle) &&
         type && type.isOfType(dmz.stance.GroupType) &&
         !dmz.object.linkHandle(dmz.stance.MediaHandle, mediaHandle, hil) &&
         (dmz.stance.getUserGroupHandle(hil) === groupHandle)) {

         Object.keys(TypesMap).forEach(function (key) {

            // type checks for the correct area to highlight, and secures this
            // against any future uses of a more generic MediaHandle

            if (TypesMap[key].isOfType(dmz.object.type(mediaHandle))) {

               MainModule.highlight(key);
            }
         });
      }
   });
};

init = function () {

   // Layout Declarations
   webForm.lookup("vLayout").addWidget(webpage);
   webpage.setHtml("<center><b>Loading...</b></center>");
   // Shared UI Items
   nextButton.standardIcon(dmz.ui.button.MediaSkipForward);
   prevButton.standardIcon(dmz.ui.button.MediaSkipBackward);
};

init();
setButtonBindings();

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     ;

   if (value && type && !dmz.object.linkHandle(dmz.stance.MediaHandle, objHandle, hil) &&
      dmz.object.linkHandle(dmz.stance.MediaHandle, objHandle, dmz.stance.getUserGroupHandle(hil))) {

      Object.keys(TypesMap).forEach(function (key) {

         if (TypesMap[key].isOfType(type)) { MainModule.highlight(key); }
      });
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      dmz.time.setTimer(self, checkNotificationsOnHIL);
      Object.keys(TypesMap).forEach(function (initType) {

         setActiveState(initType);
         setUserPlayList(objHandle);
      });
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage
         ( "Memo"
         , webForm
         , function () {

              setActiveState("Memo");
              setUserPlayList(dmz.object.hil());
              loadCurrentPrint();
           }
         , function () {

              webpage.setHtml("<center><b>Loading...</b></center>");
              checkNotifications();
           }
         );
      /*module.addPage
         ( "Newspaper"
         , "Memo" // Use the "Memo" dialog with the newspaper functions
         , function () {

              setActiveState("Newspaper");
              setUserPlayList(dmz.object.hil());
              loadCurrentPrint();
           }
         , function () {

              webpage.setHtml("<center><b>Loading...</b></center>");
              checkNotifications();
           }
         );*/
      module.addPage
         ( "Video"
         , "Memo" // Use the "Memo" dialog with the video functions
         , function (width, height) {

              dialogWidth = width;
              dialogHeight = height;
              setActiveState("Video");
              setUserPlayList(dmz.object.hil());
              loadCurrentPrint();
           }
         , function () {

              webpage.setHtml("<center><b>Loading...</b></center>");
              checkNotifications();
           }
         );
      module.addPage
         ( "Lobbyist"
         , lobbyistForm
         , function () {

              setActiveState("Lobbyist");
              setUserPlayList(dmz.object.hil());
              loadCurrentLobbyist();
           }
         , checkNotifications
         );
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});
