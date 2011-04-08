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
   , CurrentWindow = false
   , MainModule = false
   , Queued = false

   // Function decls
   , loadCurrent
   , skipForward
   , skipBackward
   , setUserPlayList
   ;

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
            linkHandle = dmz.object.linkHandle(dmz.stance.ActiveNewspaperHandle, hil, item.handle);
            if (linkHandle) {

               dmz.object.unlink(linkHandle);
               dmz.object.link(dmz.stance.ViewedNewspaperHandle, hil, item.handle);
            }
         }
      }
      else {

         self.log.error("Media error for object", SourceList[CurrentIndex].handle);
      }
   }
};

skipForward = function () {

   if (CurrentIndex < SourceList.length) {

      if ((CurrentIndex + 1) < SourceList.length) {

         CurrentIndex += 1;
         NewSource = true;
         loadCurrent();
      }
      else { CurrentIndex = 0; }
      currLabel.text(CurrentIndex + 1);
   }
};

skipBackward = function () {

   if (CurrentIndex < SourceList.length) {

      if (CurrentIndex > 0) {

         CurrentIndex -= 1;
         NewSource = true;
         loadCurrent();
      }
      else { CurrentIndex = 0; }
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

   var activeList = dmz.object.subLinks(userHandle, dmz.stance.ActiveNewspaperHandle)
     , viewedList = dmz.object.subLinks(userHandle, dmz.stance.ViewedNewspaperHandle)
     , list = []
     ;

   SourceList = []
   NewSource = true;
   if (activeList) { MainModule.highlight("Newspaper"); }
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

dmz.object.link.observe(self, dmz.stance.ActiveNewspaperHandle,
function (objHandle, attrHandle, userHandle, newspaperHandle) {

   if (CurrentWindow && (userHandle === dmz.object.hil())) {

      SourceList.unshift (
         { handle: newspaperHandle
         , source: dmz.object.text(newspaperHandle, dmz.stance.TextHandle)
         });

      CurrentIndex += 1;
      totalLabel.text(SourceList.length);

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Info
         , text: "A new item has just been added!"
         , informativeText: "Click <b>Ok</b> to switch to it. Click <b>Cancel</b> to return to the current item."
         , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Cancel
         }
         , webForm
      ).open(self, function (value) {

         if (value) {

            CurrentIndex = 0;
            currLabel.text(CurrentIndex + 1);
            NewSource = true;
            loadCurrent();
         }
      });
   }
   else if (!CurrentWindow && MainModule) { MainModule.highlight("Newspaper"); }
   else if (!MainModule) { Queued = true; }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) { setUserPlayList(objHandle); }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      MainModule = module;
      module.addPage
         ("Newspaper"
         , webForm
         , function () {

              CurrentWindow = true;
              setUserPlayList(dmz.object.hil());
              loadCurrent();
           }
         , function () { CurrentWindow = false; } // onHome
         );

      if (Queued) { Queued = false; module.highlight("Newspaper"); }
   }
});

