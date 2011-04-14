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
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   }

   // UI Elements
   , webForm = dmz.ui.loader.load("PrintMediaForm.ui")
   , nextButton = webForm.lookup("nextButton")
   , prevButton = webForm.lookup("prevButton")
   , currLabel = webForm.lookup("currentLabel")
   , totalLabel = webForm.lookup("totalLabel")
   , webpage = dmz.ui.webview.create()

   // Variables
   , CurrentIndex = 0
   , NewSource = false
   , SourceList = [] // { handle, source }
   , MainModule = false
   , Queued = false

   // Function decls
   , loadCurrent
   , skipForward
   , skipBackward
   , setUserPlayList
   ;


dmz.object.link.observe(self, dmz.stance.ViewedMemoHandle,
function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.ActiveMemoHandle, userHandle, mediaHandle);
   if (linkHandle) { dmz.object.unlink(linkHandle); }
});

loadCurrent = function () {

   var linkHandle
     , hil = dmz.object.hil()
     , item
     ;

   if (CurrentIndex < SourceList.length) {

      item = SourceList[CurrentIndex];
      if (item.source) {

         if (NewSource) {

            webpage.page().mainFrame().load(item.source);
            NewSource = false;
//            linkHandle = dmz.object.linkHandle(dmz.stance.ActiveMemoHandle, hil, item.handle);
//            if (linkHandle) {

//               dmz.object.unlink(linkHandle);
//               self.log.warn ("Unlink memo: ", dmz.object.unlink(linkHandle), linkHandle);
//               dmz.object.link(dmz.stance.ViewedMemoHandle, hil, item.handle);
//            }
            linkHandle = dmz.object.linkHandle(dmz.stance.ViewedMemoHandle, hil, video.handle);
            if (!linkHandle) {

               dmz.object.link(dmz.stance.ViewedMemoHandle, hil, video.handle);
            }
         }
      }
      else {

         self.log.error("Media error for object", SourceList[CurrentIndex].handle);
      }
   }
};

skipForward = function () {

   if ((CurrentIndex + 1) < SourceList.length) {

      CurrentIndex += 1;
      NewSource = true;
      loadCurrent();
      currLabel.text(CurrentIndex + 1);
   }
};

skipBackward = function () {

   if (CurrentIndex > 0) {

      CurrentIndex -= 1;
      NewSource = true;
      loadCurrent();
      currLabel.text(CurrentIndex + 1);
   }
};

(function () {

   webForm.lookup("vLayout").addWidget(webpage);
   nextButton.standardIcon(dmz.ui.button.MediaSkipForward);
   prevButton.standardIcon(dmz.ui.button.MediaSkipBackward);
}());

nextButton.observe(self, "clicked", skipForward);
prevButton.observe(self, "clicked", skipBackward);

setUserPlayList = function (userHandle) {

   var activeList = dmz.object.subLinks(userHandle, dmz.stance.ActiveMemoHandle)
     , viewedList = dmz.object.subLinks(userHandle, dmz.stance.ViewedMemoHandle)
     , list = []
     ;

   SourceList = []
   NewSource = true;
   self.log.warn ("memo active:", activeList);
   self.log.warn ("memo viewd:", viewedList);
   if (activeList) { MainModule.highlight("Memo"); }
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
      CurrentIndex = 0;
      currLabel.text(CurrentIndex + 1);
   }
};

dmz.object.link.observe(self, dmz.stance.ActiveMemoHandle,
function (objHandle, attrHandle, userHandle, memoHandle) {

   if (userHandle === dmz.object.hil()) {

      self.log.warn ("Memo:", memoHandle);
      self.log.error ("ActiveMemo highlight:", attrHandle, dmz.stance.ActiveNewspaperHandle, dmz.stance.ActiveMemoHandle);
      if (MainModule) { MainModule.highlight("Memo"); }
      else { Queued = true; }
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) { setUserPlayList(objHandle); }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      MainModule = module;
      module.addPage
         ("Memo"
         , webForm
         , function () {

              setUserPlayList(dmz.object.hil());
              loadCurrent();
           }
         );

      if (Queued) { Queued = false; module.highlight("Memo"); }
   }
});

