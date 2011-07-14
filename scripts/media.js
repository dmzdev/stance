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
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
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
   , specialtyLabel = lobbyistForm.lookup("specialtyLabel")
   , pictureLabel = lobbyistForm.lookup("pictureLabel")

   // Shared UI
   , nextButton = webForm.lookup("nextButton") //
   , prevButton = webForm.lookup("prevButton") //
   , currLabel = webForm.lookup("currentLabel") //
   , totalLabel = webForm.lookup("totalLabel") //

   // Variables
   , CurrentWindowName
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , MacVidExt = ".mov"
   , WinVidExt = ".wmv"

   // Handles
   , CurrentViewedHandle
   , CurrentActiveHandle
   , CurrentType
      // InitTypesMap is later initialized to InitTypesMap[key][HandleIndex] where
      // data follows the types in HandleIndex
   , InitTypesMap =
      { "Memo":
         [ dmz.stance.ViewedMemoHandle
         , dmz.stance.ActiveMemoHandle
         , dmz.stance.MemoType
         ]

      , "Newspaper":
         [ dmz.stance.ViewedNewspaperHandle
         , dmz.stance.ActiveNewspaperHandle
         , dmz.stance.NewspaperType
         ]
      , "Video":
         [ dmz.stance.ViewedVideoHandle
         , dmz.stance.ActiveVideoHandle
         , dmz.stance.VideoType
         ]
      , "Lobbyist":
         [ dmz.stance.ViewedLobbyistHandle
         , dmz.stance.ActiveLobbyistHandle
         , dmz.stance.LobbyistType
         ]
      }

   , HandleIndex =
      { viewedHandle: 0
      , activeHandle: 1
      , type: 2
      }

   // Function decls, "//" indicated shared functions with flow control base on
   // object type.
   , loadCurrentPrint
   , loadCurrentLobbyist
   , playCurrentVideo
   , pauseCurrent
   , stopCurrent
   , skipForward //
   , skipBackward //
   , setUserPlayList //
   , setActiveState //
   , setButtonBindings
   , init
   ;

setActiveState = function (windowName) {

   if (windowName == "Lobbyist") {

      CurrentViewedHandle = dmz.stance.ViewedLobbyistHandle;
      CurrentActiveHandle = dmz.stance.ActiveLobbyistHandle;
      CurrentType = dmz.stance.LobbyistType;
      nextButton = lobbyistForm.lookup("nextButton");
      prevButton = lobbyistForm.lookup("prevButton");
      currLabel = lobbyistForm.lookup("currentLabel");
      totalLabel = lobbyistForm.lookup("totalLabel");
   }

   if (windowName == "Video") {

      CurrentViewedHandle = dmz.stance.ViewedVideoHandle;
      CurrentActiveHandle = dmz.stance.ActiveVideoHandle;
      CurrentType = dmz.stance.VideoType;
      nextButton = videoForm.lookup("nextButton");
      prevButton = videoForm.lookup("prevButton");
      currLabel = videoForm.lookup("currentLabel");
      totalLabel = videoForm.lookup("totalLabel");
   }

   if (windowName == "Newspaper") {

      CurrentViewedHandle = dmz.stance.ViewedNewspaperHandle;
      CurrentActiveHandle = dmz.stance.ActiveNewspaperHandle;
      CurrentType = dmz.stance.NewspaperType;
      nextButton = webForm.lookup("nextButton");
      prevButton = webForm.lookup("prevButton");
      currLabel = webForm.lookup("currentLabel");
      totalLabel = webForm.lookup("totalLabel");
   }
   if (windowName == "Memo") {

      CurrentViewedHandle = dmz.stance.ViewedMemoHandle;
      CurrentActiveHandle = dmz.stance.ActiveMemoHandle;
      CurrentType = dmz.stance.MemoType;
      nextButton = webForm.lookup("nextButton");
      prevButton = webForm.lookup("prevButton");
      currLabel = webForm.lookup("currentLabel");
      totalLabel = webForm.lookup("totalLabel");
   }

   setButtonBindings();
   CurrentWindowName = windowName;
};

self.shutdown = function () { dmz.ui.phonon.clearPaths(); };

loadCurrentPrint = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     ;
   if (!SourceList.length) {

      webpage.setHtml("<center><b>No Current Items</b></center>");
   }

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.source) {

         if (NewSource) {

            webpage.page().mainFrame().load(item.source);
            NewSource = false;
            linkHandle = dmz.object.linkHandle(CurrentViewedHandle, hil, item.handle);
            if (!linkHandle) {

               dmz.object.link(CurrentViewedHandle, hil, item.handle);
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
   if (!SourceList.length) {

      messageText.text("");
      nameLabel.text("");
      specialtyLabel.text("");
      pictureLabel.clear();
   }

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.pic && item.title && item.text && item.name && item.handle) {

         if (NewSource) {

            messageText.text(item.text);
            nameLabel.text(item.name);
            specialtyLabel.text(item.title);
            pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(item.pic));
            if (pic) { pictureLabel.pixmap(pic); }

            NewSource = false;
            linkHandle = dmz.object.linkHandle(CurrentViewedHandle, hil, item.handle);
            if (!linkHandle) {

               dmz.object.link(CurrentViewedHandle, hil, item.handle);
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
              , hil = dmz.object.hil()
              ;

            if (hasVideo) {

               linkHandle = dmz.object.linkHandle(CurrentViewedHandle, hil, video.handle);
               if (!linkHandle) {

                  dmz.object.link(CurrentViewedHandle, hil, video.handle);
               }

               dmz.time.setTimer(self, 1, function () { source.play(); });
            }
         };

         if (NewSource) {

            self.log.warn(dmz.object.text(video.handle, dmz.stance.TitleHandle), source.currentSource(video.source));
            NewSource = false;
         }

         if (source.hasVideo()) {

            onVideo(true, source);
         }
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
   videoForm.lookup("vLayout").addWidget(video);
   // Video Specific UI controls
   dmz.ui.phonon.createPath(source, video);
   playButton.standardIcon(dmz.ui.button.MediaPlay);
   pauseButton.standardIcon(dmz.ui.button.MediaPause);
   stopButton.standardIcon(dmz.ui.button.MediaStop);
   // Shared UI Items
   nextButton.standardIcon(dmz.ui.button.MediaSkipForward);
   prevButton.standardIcon(dmz.ui.button.MediaSkipBackward);

   // Once Viewed object is created, unlink the Active object
   Object.keys(InitTypesMap).forEach(function (key) {

      dmz.object.link.observe(self, InitTypesMap[key][HandleIndex.viewedHandle],
      function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

         var linkHandle = dmz.object.linkHandle
            ( InitTypesMap[key][HandleIndex.activeHandle]
            , userHandle
            , mediaHandle
            )
         if (linkHandle) { dmz.object.unlink(linkHandle); }
      });

      // Once active link is created, highlight the correct area
      dmz.object.link.observe(self, InitTypesMap[key][HandleIndex.activeHandle],
      function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

         if ((userHandle === dmz.object.hil()) &&
            !dmz.object.flag(mediaHandle, dmz.stance.DisableHandle) &&
            dmz.object.linkHandle(dmz.stance.GameMediaHandle, dmz.stance.getUserGroupHandle(userHandle), mediaHandle)) {

            MainModule.highlight(key);
         }
      });
   });
};

init();

playButton.observe(self, "clicked", playCurrentVideo);
pauseButton.observe(self, "clicked", pauseCurrent);
stopButton.observe(self, "clicked", stopCurrent);
source.observe(self, "finished", skipForward);
setButtonBindings();

source.observe(self, "stateChanged", function (newstate) {

   var str;
   switch (newstate) {

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

setUserPlayList = function (userHandle) {

   var list = dmz.object.subLinks(dmz.stance.getUserGroupHandle(userHandle), dmz.stance.GameMediaHandle)
     , activeList = dmz.object.subLinks(userHandle, CurrentActiveHandle)
     , text
     , pic
     , name
     , title
     ;

   SourceList = [];
   NewSource = true;
   totalLabel.text("0");
   currLabel.text("0");
   CurrentIndex = 0;
   if (list) {

      list = list.filter(function (handle, index) {

         var type = dmz.object.type(handle);
         return type && type.isOfType(CurrentType) && !dmz.object.flag(handle, dmz.stance.DisabledHandle);
      });
   }

   if (list && activeList) {

      activeList.forEach(function (activeHandle) {

         if (list.indexOf(activeHandle) !== -1) { MainModule.highlight(CurrentWindowName); }
      });
   }

   if (list && list.length) {

      list.sort(function (obj1, obj2) {

         var result =
            dmz.object.scalar(obj2, dmz.stance.ID) - dmz.object.scalar(obj1, dmz.stance.ID);
         return result ? result : 0;
      });
      list.forEach(function (handle) {

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
      totalLabel.text(list.length);
      CurrentIndex = 0;
      currLabel.text(CurrentIndex + 1);
   }
};

dmz.object.flag.observe(self, dmz.stance.DisabledHandle,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     ;

   if (value && type && type.isOfType(CurrentType)
      && dmz.object.linkHandle(CurrentActiveHandle, hil, objHandle)) {

      MainModule.highlight(CurrentWindowName);
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      Object.keys(InitTypesMap).forEach (function (initType) {

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
      Object.keys(InitTypesMap).forEach(function (key) {

         if (key == "Memo" || key == "Newspaper") {

            module.addPage
               ( key
               , webForm
               , function () {

                    setActiveState(key);
                    setUserPlayList(dmz.object.hil());
                    loadCurrentPrint();
                 }
               );
         }
         if (key == "Video") {

            module.addPage
               ( key
               , videoForm
               , function () {

                    setActiveState(key);
                    setUserPlayList(dmz.object.hil());
                    CurrentIndex = 0;
                    playCurrentVideo();
                 }
               , stopCurrent
               );
         }
         if (key == "Lobbyist") {

            module.addPage
               ( key
               , lobbyistForm
               , function () {

                    setActiveState(key);
                    setUserPlayList(dmz.object.hil());
                    loadCurrentLobbyist();
                 }
               );
         }
      });

      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

