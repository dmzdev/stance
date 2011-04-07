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
//, source = dmz.ui.phonon.createMediaObject("http://www.chds.us/media/viewpoints/mov/chds_viewpoints%2029_rodrigo_gomez.mov")
//, source2 = dmz.ui.phonon.createMediaObject("http://www.chds.us/coursefiles/DA3210/videos/obsession/obsession_radical_islam.mov")

// Variables
, CurrentIndex = 0
, NewSource = false
, SourceList = [] // { handle, source }
, CurrentWindow = false
, MainModule = false
, VideoQueue = false

// Function decls
, playCurrent
, pauseCurrent
, stopCurrent
, skipForward
, skipBackward
, setUserPlayList
;

playCurrent = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , video
     ;

   if (CurrentIndex < SourceList.length) {

      video = SourceList[CurrentIndex];
      if (video.source) {

         if (NewSource) { source.currentSource(video.source); NewSource = false; }
         if (source.hasVideo()) {

            linkHandle = dmz.object.linkHandle(dmz.stance.ActiveVideoHandle, hil, video.handle);
            if (linkHandle) {

               dmz.object.unlink(linkHandle);
               dmz.object.link(dmz.stance.ViewedVideoHandle, hil, video.handle);
            }
            source.play();
         }
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

   var activeList = dmz.object.subLinks(userHandle, dmz.stance.ActiveVideoHandle)
     , viewedList = dmz.object.subLinks(userHandle, dmz.stance.ViewedVideoHandle)
     , list = []
     ;

   SourceList = []
   NewSource = true;
   if (activeList && viewedList) { list = activeList.concat(viewedList); }
   else { list = activeList ? activeList : viewedList; }

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

   if (CurrentWindow && (userHandle === dmz.object.hil())) {

      SourceList.unshift (
         { handle: videoHandle
         , source: dmz.object.text(videoHandle, dmz.stance.TextHandle)
         });

      CurrentIndex += 1;
      totalLabel.text(SourceList.length);
      pauseCurrent();

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Info
         , text: "A new video clip has just been added!"
         , informativeText: "Click <b>Ok</b> to switch to that video. Click <b>Cancel</b> to resume your current video."
         , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Cancel
         }
         , videoForm
      ).open(self, function (value) {

         if (value) { CurrentIndex = 0; NewSource = true; }
         currLabel.text(CurrentIndex + 1);
         playCurrent();
      });
   }
   else if (!CurrentWindow && MainModule) { MainModule.highlight("Video"); }
   else if (!MainModule) { VideoQueue = true; }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) { setUserPlayList(objHandle); }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      MainModule = module;
      module.addPage
         ("Video"
         , videoForm
         , function () {

              CurrentWindow = true;
              setUserPlayList(dmz.object.hil());
              CurrentIndex = 0;
              playCurrent();
           }
         , function () { CurrentWindow = false; stopCurrent(); } // onHome
         );

      if (VideoQueue) { VideoQueue = false; module.highlight("Video"); }
   }
});

