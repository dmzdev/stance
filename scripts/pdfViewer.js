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
   , pdfViewer = dmz.ui.loader.load("StudentPdfDialog.ui")
   , pdfScrollArea = pdfViewer.lookup("pdfScrollArea")
   , pdfWebView = pdfViewer.lookup("pdfWebView")
   , addPdfButton = pdfViewer.lookup("addPdfButton")

   // Variables
   , hil
   , userGroupHandle
   , PdfItems = {}
   , UsersItems = {}
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Functions
   , initiatePdfPostItemUi
   , insertIntoScrollArea
   , openWindow
   , init
   ;

initiatePdfPostItemUi = function (pdfItem) {

   if (pdfItem && !pdfItem.ui) {

      pdfItem.ui = {};
      pdfItem.ui.postItem = dmz.ui.loader.load("PdfPostItem.ui");
      pdfItem.ui.titleLabel = pdfItem.ui.postItem.lookup("titleLabel");
      pdfItem.ui.linkLabel = pdfItem.ui.postItem.lookup("linkLabel");
      pdfItem.ui.postedByLabel = pdfItem.ui.postItem.lookup("postedByLabel");
   }
};

insertIntoScrollArea = function (pdfItem) {

};

openWindow = function () {

   var index = 0;

   Object.keys(PdfItems).forEach(function (key) {

      initiatePdfPostItemUi(PdfItems[key]);
      if (PdfItems[key].groups.indexOf(userGroupHandle) !== -1) {

         insertIntoScrollArea(PdfItems[key]);
      }
   });
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.PdfItemType)) {

      PdfItems[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         };
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
      });
   }
});

dmz.object.text.observe(self, dmz.stance.TitleHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (PdfItems[objHandle]) {

      PdfItems[objHandle].title = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (PdfItems[objHandle]) {

      PdfItems[objHandle].link = newVal;
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (PdfItems[objHandle]) {

      PdfItems[objHandle].createdAt = newVal;
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {


   if (PdfItems[supHandle]) {

      PdfItems[supHandle].createdByHandle = subHandle;
      dmz.time.setTimer(self, function () {

         PdfItems[supHandle].createdByName = dmz.stance.getDisplayName(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.MediaHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (PdfItems[supHandle]) {

      if (dmz.object.type(subHandle).isOfType(dmz.stance.GroupType)) {

         PdfItems[supHandle].groups.push(subHandle);
      }
      else if (dmz.object.type(subHandle).isOfType(dmz.stance.UserType)) {

         UserItems[supHandle].viewed.push(subHandle);
      }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Newspaper", pdfViewer, openWindow);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});
