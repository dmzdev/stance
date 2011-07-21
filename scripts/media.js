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
      , phonon: require("dmz/ui/phonon")
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
   , videoForm = dmz.ui.loader.load("VideoForm.ui")
   , lobbyistForm = dmz.ui.loader.load("LobbyistWindow.ui")

   // WebForm specific UI
   , webpage = dmz.ui.webview.create()

   // Video Specific UI
   , playButton = videoForm.lookup("playButton")
   , pauseButton = videoForm.lookup("pauseButton")
   , stopButton = videoForm.lookup("stopButton")
   , stateLabel = videoForm.lookup("mediaStateLabel")
   , video = dmz.ui.phonon.createVideoPlayer()
   , source = dmz.ui.phonon.createMediaObject()

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

   // Variables
   , VideoHomeMessage = dmz.message.create("VideoHome")
   , CurrentWindowName
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , MacVidExt = ".mov"
   , WinVidExt = ".wmv"
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
   , playCurrentVideo
   , pauseCurrent
   , stopCurrent
   , stopCurrentOnHome
   , skipForward //
   , skipBackward //
   , setUserPlayList //
   , setCurrentType //
   , setActiveState //
   , setButtonBindings
   , init
   ;

self.shutdown = function () { dmz.ui.phonon.clearPaths(); };

videoForm.observe(self, "homeButton", "clicked", function () {

   stopCurrentOnHome();
   VideoHomeMessage.send();
});

setActiveState = function (state) {

   CurrentType = TypesMap[state];
   switch (state) {

      case ("Lobbyist"):

         nextButton = lobbyistForm.lookup("nextButton");
         prevButton = lobbyistForm.lookup("prevButton");
         currLabel = lobbyistForm.lookup("currentLabel");
         totalLabel = lobbyistForm.lookup("totalLabel");
         break;
      case ("Video"):

         nextButton = videoForm.lookup("nextButton");
         prevButton = videoForm.lookup("prevButton");
         currLabel = videoForm.lookup("currentLabel");
         totalLabel = videoForm.lookup("totalLabel");
         break;
      case ("Newspaper"):

         nextButton = webForm.lookup("nextButton");
         prevButton = webForm.lookup("prevButton");
         currLabel = webForm.lookup("currentLabel");
         totalLabel = webForm.lookup("totalLabel");
         break;
      case ("Memo"):

         nextButton = webForm.lookup("nextButton");
         prevButton = webForm.lookup("prevButton");
         currLabel = webForm.lookup("currentLabel");
         totalLabel = webForm.lookup("totalLabel");
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
   if (groupMediaList) {

      if (groupMediaList.length) {

         MainModule.highlight(CurrentWindowName);
      }
   }

   if (groupMediaList) {

      for (itor = 0; itor < groupMediaList.length; itor+=1) {

         combinedMediaList.push(groupMediaList[itor]);
      }
   }
   if (userMediaList) {

      for (itor = 0; itor < userMediaList.length; itor+=1) {

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

         var result =
            dmz.object.scalar(obj2, dmz.stance.ID) - dmz.object.scalar(obj1, dmz.stance.ID);
         return result ? result : 0;
      });
      combinedMediaList.forEach(function (handle) {

         if (CurrentWindowName == "Video" || CurrentWindowName == "Memo" || CurrentWindowName == "Newspaper") {

            text = dmz.object.text(handle, dmz.stance.TextHandle);
            if (CurrentWindowName == "Video") {

               stateLabel.text("");
               if (dmz.defs.OperatingSystem && (dmz.defs.OperatingSystem === dmz.defs.Win32)) {

                  text = text.replace(MacVidExt, WinVidExt);
               }
            }

            SourceList.push (
               { handle: handle
               , source: text
               });
         }
         if (CurrentWindowName == "Lobbyist") {

            pic = dmz.object.text(handle, dmz.stance.PictureHandle);
            name = dmz.object.text(handle, dmz.stance.NameHandle);
            title = dmz.object.text(handle, dmz.stance.TitleHandle);
            text = dmz.object.text(handle, dmz.stance.TextHandle);

            SourceList.push (
               { handle: handle
               , pic: pic
               , name: name
               , title: title
               , text: text
               });
         }
      });
      totalLabel.text(combinedMediaList.length);
      CurrentIndex = 0;
      if (SourceList.length !== 0) { currLabel.text(CurrentIndex + 1); }
   }
};

loadCurrentPrint = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     ;
   if (!SourceList.length) { webpage.setHtml("<center><b>No Current Items</b></center>"); }

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.source) {

         if (NewSource) {

            webpage.page().mainFrame().load(item.source);
            NewSource = false;
            linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, item.handle, hil);
            if (!linkHandle) {

               dmz.object.link(dmz.stance.MediaHandle, item.handle, hil);
            }
         }
      }
   }
};

loadCurrentLobbyist = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     , pic
     ;

   if (SourceList.length == 0) {

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
         }
      }
   }
};

playCurrentVideo = function () {

   var video
     , onVideo
     ;

   if (CurrentIndex < SourceList.length) {

      video = SourceList[CurrentIndex];
      if (video.source) {

         onVideo = function (hasVideo, source) {

            var linkHandle
              , hil = dmz.object.hil();
              ;

            if (hasVideo) {
               linkHandle = dmz.object.linkHandle(dmz.stance.MediaHandle, video.handle, hil);
               if (!linkHandle) {

                  dmz.object.link(dmz.stance.MediaHandle, video.handle, hil);
               }

               dmz.time.setTimer(self, 1, function () { source.play(); });
            }
         };
         if (NewSource) {

            source.currentSource(video.source);
            NewSource = false;
         }
         if (source.hasVideo()) { onVideo(true, source); }
         pauseButton.enabled(true);
         playButton.enabled(false);
      }
      else {

         stateLabel.text("<font=\"red\">Video error.</font>");
         self.log.error("Video error for object", SourceList[CurrentIndex].handle);
      }
   }
};

pauseCurrent = function () {

   if (CurrentIndex < SourceList.length) {

      if (source.hasVideo()) { source.pause(); }
      playButton.enabled(true);
      pauseButton.enabled(false);
   }
};

/* This timer is to stop a bug involving the user pressing home before the current
   video loads, thus causing the video to not stop (since it hasn't finished starting) and
   it starts while the user is in the home screen
*/
stopCurrentOnHome = function () {

   stopCurrent();
//   dmz.time.setTimer(self, 1, function () { if (source.hasVideo ()) { source.stop(); }});
}

stopCurrent = function () {

   if (CurrentIndex < SourceList.length) {

      if (source.hasVideo()) { source.stop(); }
      playButton.enabled(true);
      pauseButton.enabled(false);
   }
};

skipForward = function () {

   if (CurrentIndex < SourceList.length) {

      if (CurrentWindowName == "Video") {

         stopCurrent();
      }
      if ((CurrentIndex + 1) < SourceList.length) {

         CurrentIndex += 1;
         NewSource = true;
         if (CurrentWindowName == "Video") {

            playCurrentVideo();
         }
         if (CurrentWindowName == "Memo" || CurrentWindowName == "Newspaper") {

            loadCurrentPrint();
         }
         if (CurrentWindowName == "Lobbyist") {

            loadCurrentLobbyist();
         }
      }
      else { CurrentIndex = 0; }
      currLabel.text(CurrentIndex + 1);
   }
};

skipBackward = function () {

   if (CurrentIndex < SourceList.length) {

      if (CurrentWindowName == "Video") {

         stopCurrent();
      }
      if (CurrentIndex > 0) {

         CurrentIndex -= 1;
         NewSource = true;
         if (CurrentWindowName == "Video") {

            playCurrentVideo();
         }
         if (CurrentWindowName == "Memo" || CurrentWindowName == "Newspaper") {

            loadCurrentPrint();
         }
         if (CurrentWindowName == "Lobbyist") {

            loadCurrentLobbyist();
         }
      }
      else { CurrentIndex = 0; }
      currLabel.text(CurrentIndex + 1);
   }
};

setButtonBindings = function () {

   nextButton.observe(self, "clicked", skipForward);
   prevButton.observe(self, "clicked", skipBackward);
};

init = function () {

   // Layout Declarations
   webForm.lookup("vLayout").addWidget(webpage);
   webpage.setHtml("<center><b>Loading...</b></center>");
   videoForm.lookup("vLayout").addWidget(video);
   // Video Specific UI controls
   dmz.ui.phonon.createPath(source, video);
   playButton.standardIcon(dmz.ui.button.MediaPlay);
   pauseButton.standardIcon(dmz.ui.button.MediaPause);
   stopButton.standardIcon(dmz.ui.button.MediaStop);
   // Shared UI Items
   nextButton.standardIcon(dmz.ui.button.MediaSkipForward);
   prevButton.standardIcon(dmz.ui.button.MediaSkipBackward);

   // When object is created for a group, check its type and highlight if needed
   dmz.object.link.observe(self, dmz.stance.MediaHandle,
   function (linkHandle, attrHandle, mediaHandle, groupHandle) {

      var hil = dmz.object.hil()
        , type = dmz.object.type(groupHandle)
        ;
      // check that media is not disabled, not in user's list, and is in user's group list, and user is in the group
      if (dmz.object.flag(mediaHandle, dmz.stance.ActiveHandle) &&
         type && type.isOfType(dmz.stance.GroupType) &&
         !dmz.object.linkHandle(dmz.stance.MediaHandle, mediaHandle, hil) &&
         (dmz.stance.getUserGroupHandle(hil) === groupHandle)) {

         Object.keys(TypesMap).forEach(function (key) {

            /* type checks for the correct area to highlight, and secures this
               against any future uses of a more generic MediaHandle
            */
            if (TypesMap[key].isOfType(dmz.object.type(mediaHandle))) {

               MainModule.highlight(key);
            }
         });
      }
   });
};

init();

playButton.observe(self, "clicked", playCurrentVideo);
pauseButton.observe(self, "clicked", pauseCurrent);
stopButton.observe(self, "clicked", stopCurrent);
source.observe(self, "finished", skipForward);
setButtonBindings();

source.observe(self, "stateChanged", function (newState) {

   var str;
   switch (newState) {

      case 0: str = "Loading..."; break;
      case 1: str = "Stopped"; break;
      case 2: str = "Playing!"; break;
      case 3: str = "Buffering."; break;
      case 4: str = "Paused"; break;
      case 5: str = "Error: " + source.errorString(); break;
      default: str = "Video State error."; break;
   }
   stateLabel.text(str);
});

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

      Object.keys(TypesMap).forEach (function (initType) {

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
         , function () { webpage.setHtml("<center><b>Loading...</b></center>"); }
         );
      module.addPage
         ( "Newspaper"
         , "Memo" // Use the "Memo" dialog with the newspaper functions
         , function () {

              setActiveState("Newspaper");
              setUserPlayList(dmz.object.hil());
              loadCurrentPrint();
           }
         , function () { webpage.setHtml("<center><b>Loading...</b></center>"); }
         );
      module.addWidget
         ( "Video"
         , videoForm
         , function () {

              setActiveState("Video");
              setUserPlayList(dmz.object.hil());
              playCurrentVideo();
           }
         , stopCurrentOnHome
         );
      module.addPage
         ( "Lobbyist"
         , lobbyistForm
         , function () {

              setActiveState("Lobbyist");
              setUserPlayList(dmz.object.hil());
              loadCurrentLobbyist();
           }
         );
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});
