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
   //    "//" indicated a UI element shared between Video and News-Memo, the
   //    observers are reset for these elements when one switches between Video
   //    and News-Memo
   , webForm = dmz.ui.loader.load("PrintMediaForm.ui")
   , videoForm = dmz.ui.loader.load("VideoForm.ui")
   , playButton = videoForm.lookup("playButton")
   , pauseButton = videoForm.lookup("pauseButton")
   , stopButton = videoForm.lookup("stopButton")
   , nextButton = webForm.lookup("nextButton") //
   , prevButton = webForm.lookup("prevButton") //
   , currLabel = webForm.lookup("currentLabel") //
   , totalLabel = webForm.lookup("totalLabel") //
   , stateLabel = videoForm.lookup("mediaStateLabel")
   , video = dmz.ui.phonon.createVideoPlayer()
   , source = dmz.ui.phonon.createMediaObject()
   , webpage = dmz.ui.webview.create()

   // Variables
   , CurrentWindowName
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = [] // { handle, source }
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
      }

   , HandleIndex =
      { viewedHandle: 0
      , activeHandle: 1
      , type: 2
      }

   // Function decls
   , loadCurrent
   , playCurrent
   , pauseCurrent
   , stopCurrent
   , skipForward //
   , skipBackward //
   , setUserPlayList //
   , setActiveState
   , setObserver
   , setButtonBindings
   ;

setActiveState = function (windowName) {

   if (windowName == "Newspaper" || windowName == "Memo") {

      nextButton = webForm.lookup("nextButton");
      prevButton = webForm.lookup("prevButton");
      currLabel = webForm.lookup("currentLabel");
      totalLabel = webForm.lookup("totalLabel");
      setButtonBindings();
   }
   if (windowName == "Video") {

      CurrentViewedHandle = dmz.stance.ViewedVideoHandle;
      CurrentActiveHandle = dmz.stance.ActiveVideoHandle;
      CurrentType = dmz.stance.VideoType;
      nextButton = videoForm.lookup("nextButton");
      prevButton = videoForm.lookup("prevButton");
      currLabel = videoForm.lookup("currLabel");
      totalLabel = videoForm.lookup("totalLabel");
      setButtonBindings();
   }
   if (windowName == "Newspaper") {

      CurrentViewedHandle = dmz.stance.ViewedNewspaperHandle;
      CurrentActiveHandle = dmz.stance.ActiveNewspaperHandle;
      CurrentType = dmz.stance.NewspaperType;
   }
   if (windowName == "Memo") {

      CurrentViewedHandle = dmz.stance.ViewedMemoHandle;
      CurrentActiveHandle = dmz.stance.ActiveMemoHandle;
      CurrentType = dmz.stance.MemoType;
   }

   CurrentWindowName = windowName;
};

self.shutdown = function () { dmz.ui.phonon.clearPaths(); };

loadCurrent = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     , onVideo
     ;

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

playCurrent = function () {

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

            source.observe(self, "hasVideoChanged", onVideo);
            self.log.warn(dmz.object.text(video.handle, dmz.stance.TitleHandle), source.currentSource(video.source));
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

            playCurrent();
         }
         if (CurrentWindowName == "Memo" || CurrentWindowName == "Newspaper") {

            loadCurrent();
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

            playCurrent();
         }
         if (CurrentWindowName == "Memo" || CurrentWindowName == "Newspaper") {

            loadCurrent();
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

(function () {

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

      dmz.object.link.observe(self, InitTypesMap[key][HandleIndex.activeHandle],
      function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

         if ((userHandle === dmz.object.hil()) &&
            !dmz.object.flag(mediaHandle, dmz.stance.DisableHandle) &&
            dmz.object.linkHandle(dmz.stance.GameMediaHandle, dmz.stance.getUserGroupHandle(userHandle), mediaHandle)) {

            MainModule.highlight(key);
         }
      });
   });
}());

playButton.observe(self, "clicked", playCurrent);
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
     ;

   SourceList = []
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

   if (value) { setUserPlayList(objHandle); }
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
                    loadCurrent();
                 }
               );
         }
         if (key == "Video") {

            module.addPage
               ( key
               , videoForm
               , function (windowName) {

                    setActiveState(key);
                    setUserPlayList(dmz.object.hil());
                    CurrentIndex = 0;
                    playCurrent();
                 }
               , stopCurrent
               );
         }
      });

      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

