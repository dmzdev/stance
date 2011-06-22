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
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Function decls
   , loadCurrent
   , skipForward
   , skipBackward
   , setUserPlayList
   ;

dmz.object.link.observe(self, dmz.stance.ViewedNewspaperHandle,
function (linkObjHandle, attrHandle, userHandle, mediaHandle) {

   var linkHandle = dmz.object.linkHandle(dmz.stance.ActiveNewspaperHandle, userHandle, mediaHandle);
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
            linkHandle = dmz.object.linkHandle(dmz.stance.ViewedNewspaperHandle, hil, item.handle);
            if (!linkHandle) {

               dmz.object.link(dmz.stance.ViewedNewspaperHandle, hil, item.handle);
            }
         }
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

   var list = dmz.object.subLinks(dmz.stance.getUserGroupHandle(userHandle), dmz.stance.GameMediaHandle)
     , activeList = dmz.object.subLinks(userHandle, dmz.stance.ActiveNewspaperHandle)
     ;

   SourceList = []
   NewSource = true;
   totalLabel.text("0");
   currLabel.text("0");
   CurrentIndex = 0;
   if (list) {

      list = list.filter(function (handle, index) {

         var type = dmz.object.type(handle);
         return type && type.isOfType(dmz.stance.NewspaperType) && !dmz.object.flag(handle, dmz.stance.DisabledHandle);
      });
   }
   if (list && activeList) {

      activeList.forEach(function (activeHandle) {

         if (list.indexOf(activeHandle) !== -1) { MainModule.highlight("Newspaper"); }
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
      CurrentIndex = 0;
      currLabel.text(CurrentIndex + 1);
   }
};

dmz.object.link.observe(self, dmz.stance.ActiveNewspaperHandle,
function (objHandle, attrHandle, userHandle, newspaperHandle) {

   if ((userHandle === dmz.object.hil()) &&
      !dmz.object.flag(newspaperHandle, dmz.stance.DisabledHandle) &&
      dmz.object.linkHandle(dmz.stance.GameMediaHandle, dmz.stance.getUserGroupHandle(userHandle), newspaperHandle)) {

      MainModule.highlight("Newspaper");
   }
});

dmz.object.flag.observe(self, dmz.stance.DisabledHandle,
function (objHandle, attrHandle, value) {

   var type = dmz.object.type(objHandle)
     , hil = dmz.object.hil()
     ;

   if (value && type && type.isOfType(dmz.stance.NewspaperType)
      && dmz.object.linkHandle(dmz.stance.ActiveNewspaperHandle, hil, objHandle)) {

      MainModule.highlight("Newspaper");
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
         ("Newspaper"
         , webForm
         , function () {

              setUserPlayList(dmz.object.hil());
              loadCurrent();
           }
         );

      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

