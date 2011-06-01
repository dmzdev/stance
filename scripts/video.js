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
   , videoForm = dmz.ui.loader.load("VideoForm.ui")
   , playButton = videoForm.lookup("playButton")
   , pauseButton = videoForm.lookup("pauseButton")
   , stopButton = videoForm.lookup("stopButton")
   , nextButton = videoForm.lookup("nextButton")
   , prevButton = videoForm.lookup("prevButton")
   , currLabel = videoForm.lookup("currLabel")
   , totalLabel = videoForm.lookup("totalLabel")
   , video = dmz.ui.phonon.createVideoPlayer()
   , source = dmz.ui.phonon.createMediaObject()

   // Variables
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = [] // { handle, source }
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Function decls
   , playCurrent
   , pauseCurrent
   , stopCurrent
   , skipForward
   , skipBackward
   , setUserPlayList
   ;

self.shutdown = function () {

   dmz.ui.phonon.clearPaths();
};

dmz.object.link.observe(self, dmz.stance.ViewedVideoHandle,
function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.ActiveVideoHandle, userHandle, mediaHandle);
   if (linkHandle) { dmz.object.unlink(linkHandle); }
});

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

            self.log.warn ("onVideo:", hasVideo, source);
            if (hasVideo) {

               linkHandle = dmz.object.linkHandle(dmz.stance.ViewedVideoHandle, hil, video.handle);
               if (!linkHandle) {

                  dmz.object.link(dmz.stance.ViewedVideoHandle, hil, video.handle);
               }

               source.play();
            }
         };

         if (NewSource) {

            source.observe(self, "hasVideoChanged", onVideo);
            source.currentSource(video.source);
            NewSource = false;
            require("dmz/runtime/time").setTimer(self, 1, function () {

               source.state();
            });
         }

         if (source.hasVideo()) { onVideo(true, source); }
         pauseButton.enabled(true);
         playButton.enabled(false);
      }
      else {

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

      stopCurrent();
      if ((CurrentIndex + 1) < SourceList.length) {

         CurrentIndex += 1;
         NewSource = true;
         playCurrent();
      }
      else { CurrentIndex = 0; }
      currLabel.text(CurrentIndex + 1);
   }
};

skipBackward = function () {

   if (CurrentIndex < SourceList.length) {

      stopCurrent();
      if (CurrentIndex > 0) {

         CurrentIndex -= 1;
         NewSource = true;
         playCurrent();
      }
      else { CurrentIndex = 0; }
      currLabel.text(CurrentIndex + 1);
   }
};

(function () {

   videoForm.lookup("vLayout").addWidget(video);
   playButton.standardIcon(dmz.ui.button.MediaPlay);
   pauseButton.standardIcon(dmz.ui.button.MediaPause);
   stopButton.standardIcon(dmz.ui.button.MediaStop);
   nextButton.standardIcon(dmz.ui.button.MediaSkipForward);
   prevButton.standardIcon(dmz.ui.button.MediaSkipBackward);
   dmz.ui.phonon.createPath(source, video);

}());

playButton.observe(self, "clicked", playCurrent);
pauseButton.observe(self, "clicked", pauseCurrent);
stopButton.observe(self, "clicked", stopCurrent);
nextButton.observe(self, "clicked", skipForward);
prevButton.observe(self, "clicked", skipBackward);
source.observe(self, "finished", skipForward);

setUserPlayList = function (userHandle) {

   var list = dmz.object.subLinks(dmz.stance.getUserGroupHandle(userHandle), dmz.stance.GameMediaHandle)
     , activeList = dmz.object.subLinks(userHandle, dmz.stance.ActiveVideoHandle)
     ;

   SourceList = []
   NewSource = true;
   totalLabel.text("0");
   currLabel.text("0");
   CurrentIndex = 0;
   if (list) {

      list = list.filter(function (handle, index) {

         var type = dmz.object.type(handle);
         return type && type.isOfType(dmz.stance.VideoType);
      });
   }
   if (list && activeList) {


      activeList.forEach(function (activeHandle) {

         if (list.indexOf(activeHandle) !== -1) { MainModule.highlight("Video"); }
      });
   }

   if (list && list.length) {

      list.sort(function (obj1, obj2) {

         var result =
            dmz.object.scalar(obj2, dmz.stance.ID) - dmz.object.scalar(obj1, dmz.stance.ID);
         return result ? result : 0;
      });
      list.forEach(function (handle) {

         SourceList.push (
            { handle: handle
            , source: dmz.object.text(handle, dmz.stance.TextHandle)
            });
      });
      totalLabel.text(list.length);
      currLabel.text("1");
      CurrentIndex = 0;
   }
};

dmz.object.link.observe(self, dmz.stance.ActiveVideoHandle,
function (objHandle, attrHandle, userHandle, videoHandle) {

   if ((userHandle === dmz.object.hil()) &&
      dmz.object.linkHandle(dmz.stance.GameMediaHandle, dmz.stance.getUserGroupHandle(userHandle), videoHandle)) {

      MainModule.highlight("Video");
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
      module.addPage
         ("Video"
         , videoForm
         , function () {

              setUserPlayList(dmz.object.hil());
              CurrentIndex = 0;
              playCurrent();
           }
         , stopCurrent // onHome
         );

      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

