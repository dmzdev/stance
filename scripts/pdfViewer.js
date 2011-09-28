var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , event: require("dmz/ui/event")
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , label: require("dmz/ui/label")
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
   , scrollFormContent = pdfScrollArea.widget()
   , pdfContentLayout = dmz.ui.layout.createVBoxLayout()
   , groupSelectionLayout = pdfViewer.lookup("groupSelectionLayout")
   , pdfWebView = pdfViewer.lookup("pdfWebView")
   , addPdfButton = pdfViewer.lookup("addPdfButton")
   , titleTextEdit = pdfViewer.lookup("titleTextEdit")
   , linkTextEdit = pdfViewer.lookup("linkTextEdit")

   // Variables
   , hil
   , beenOpened = false
   , userGroupHandle
   , CurrentPdf
   , Groups = {}
   , PdfItems = {}
   , PdfArray = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Functions
   , mouseEvent
   , clearLayout
   , initiatePdfPostItemUi
   , indexOfPdfItem
   , insertIntoScrollArea
   , openWindow
   , checkNotifications
   , init
   ;

addPdfButton.observe(self, "clicked", function () {

   var pdfItemHandle
     , atLeastOneChecked = false
     ;

   if ((titleTextEdit.text() !== "") && (linkTextEdit.text() !== "")) {

      pdfItemHandle = dmz.object.create(dmz.stance.PdfItemType);
      dmz.object.text(pdfItemHandle, dmz.stance.TitleHandle, titleTextEdit.text());
      dmz.object.text(pdfItemHandle, dmz.stance.TextHandle, linkTextEdit.text());
      dmz.object.link(dmz.stance.CreatedByHandle, pdfItemHandle, hil);
      dmz.object.link(dmz.stance.MediaHandle, pdfItemHandle, hil);
      dmz.object.flag(pdfItemHandle, dmz.stance.UpdateStartTimeHandle, true);
      dmz.object.timeStamp(pdfItemHandle, dmz.stance.CreatedAtServerTimeHandle, 0);
      dmz.object.flag(pdfItemHandle, dmz.stance.ActiveHandle, true);
      if (dmz.stance.isAllowed(hil, dmz.stance.SwitchGroupFlag)) {

         Object.keys(Groups).forEach(function (key) {

            if (Groups[key].ui && Groups[key].ui.checkBox && Groups[key].ui.checkBox.isChecked()) {

               atLeastOneChecked = true;
               dmz.object.link(dmz.stance.MediaHandle, pdfItemHandle, Groups[key].handle);
            }
         });
      }
      else {

         atLeastOneChecked = true;
         dmz.object.link(dmz.stance.MediaHandle, pdfItemHandle, userGroupHandle);
      }
      if (atLeastOneChecked) { dmz.object.activate(pdfItemHandle); }
      titleTextEdit.text("");
      linkTextEdit.text("");
   }
});

mouseEvent = function (object, event) {

   var type = event.type();

   PdfArray.forEach(function (pdfItem) {

      if ((object == pdfItem.ui.postItem) && (type == dmz.ui.event.MouseButtonPress) &&
         (CurrentPdf != pdfItem)) {

         // set CurrentPdf widget back to grey and change value to new widget
         if (CurrentPdf) {

            CurrentPdf.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
         }
         CurrentPdf = pdfItem;
         dmz.time.setTimer(self, function () {

            // link and set widget to dark grey (current)
            dmz.object.link(dmz.stance.MediaHandle, pdfItem.handle, hil);
            pdfItem.ui.notificationLabel.hide();
            pdfItem.ui.postItem.styleSheet("* { background-color: rgb(180, 180, 180); border-style: solid; }");
            pdfWebView.setHtml(
               "<center><iframe src='http://docs.google.com/viewer?" +
               "url=" + encodeURIComponent(pdfItem.link) +
               "&embedded=true'" +
               "width='" + (pdfWebView.page().width() - 20) +
               "' height='" + (pdfWebView.page().height() - 20) +
               "' style='border: none;'></iframe></center>");
         });
      }
      else if ((object == pdfItem.ui.postItem) && (type == dmz.ui.event.Enter)) {

         if (pdfItem.viewed.indexOf(hil) === -1) { // enter hasn't seen (redder)

            pdfItem.ui.postItem.styleSheet("* { background-color: rgb(190, 140, 140); border-style: solid; }");
         }
         else if (CurrentPdf && CurrentPdf.ui && (CurrentPdf.ui.postItem == object)) {

            // Placeholder in case we want to make the hover chnge color for the current PDF
         }
         else { // enter seen (greyer)

            pdfItem.ui.postItem.styleSheet("* { background-color: rgb(180, 180, 180); border-style: solid; }");
         }
      }
      else if ((object == pdfItem.ui.postItem) && (type == dmz.ui.event.Leave)) {

         if (pdfItem.viewed.indexOf(hil) === -1) { // back to red

            pdfItem.ui.postItem.styleSheet("* { background-color: rgb(210, 180, 180); border-style: solid; }");
         }
         else if (CurrentPdf && CurrentPdf.ui && (CurrentPdf.ui.postItem == object)) {

            // Also a placeholder for leeaving the currently displayed PDF
         }
         else { // back to grey

            pdfItem.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
         }
      }
   });
};

clearLayout = function () {

   var widget;

   if (scrollFormContent && pdfContentLayout) {

      widget = pdfContentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = pdfContentLayout.takeAt(0);
      }
      pdfContentLayout.addStretch(1);
   }

   if (groupSelectionLayout) {

      widget = groupSelectionLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = groupSelectionLayout.takeAt(0);
      }
      groupSelectionLayout.addStretch(0);
   }
};

initiatePdfPostItemUi = function (pdfItem) {

   if (pdfItem && !pdfItem.ui) {

      pdfItem.ui = {};
      pdfItem.ui.postItem = dmz.ui.loader.load("PdfPostItem.ui");
      pdfItem.ui.titleLabel = pdfItem.ui.postItem.lookup("titleLabel");
      pdfItem.ui.createdByLabel = pdfItem.ui.postItem.lookup("postedByLabel");
      pdfItem.ui.notificationLabel = dmz.ui.label.create(pdfItem.ui.postItem);
      pdfItem.ui.notificationLabel.fixedWidth(34);
      pdfItem.ui.titleLabel.text(pdfItem.title);
      pdfItem.ui.createdByLabel.text(pdfItem.createdBy);
      pdfItem.ui.postItem.eventFilter(self, mouseEvent);
      if (pdfItem.viewed.indexOf(hil) === -1) { // not seen

         pdfItem.ui.notificationLabel.pixmap((dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify"))));
         pdfItem.ui.notificationLabel.move(5, 5);
         pdfItem.ui.titleLabel.raise();
         pdfItem.ui.titleLabel.styleSheet("* { background-color: rgba(0, 0, 0, 0); }");
         pdfItem.ui.postItem.styleSheet("* { background-color: rgb(210, 180, 180); border-style: solid; }");
      }
      else { // seen

         pdfItem.ui.notificationLabel.hide();
         pdfItem.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
      }
   }
};

indexOfPdfItem = function (pdfItem) {

   var itor
     , result = -1
     ;

   for (itor = 0; itor < PdfArray.length; itor += 1) {

      if (PdfArray[itor].handle === pdfItem.handle) {

         result = itor;
      }
   }
   return result;
};

insertIntoScrollArea = function (pdfItem) {

   var newStartTime
     , insertedStartTime
     , inserted = false
     , itor
     ;

   if (pdfItem.ui) {

      newStartTime = pdfItem.createdAt;
      if ((newStartTime === 0) || (PdfArray.length === 0)) {

         inserted = true;
         if (PdfArray.length === 0) { PdfArray.push(pdfItem); }
         else { PdfArray.splice(0, 0, pdfItem); }
         pdfContentLayout.insertWidget(0, pdfItem.ui.postItem);
         pdfItem.ui.postItem.show();
      }
      for (itor = 0; itor < PdfArray.length; itor += 1) {

         if (!inserted) {

            insertedStartTime = PdfArray[itor].createdAt;
            if (newStartTime >= insertedStartTime) {

               inserted = true;
               if (PdfArray.length === 0) { PdfArray.push(pdfItem); }
               else { PdfArray.splice(itor, 0, pdfItem); }
               pdfContentLayout.insertWidget(itor, pdfItem.ui.postItem);
               pdfItem.ui.postItem.show();
            }
         }
      }
      if (!inserted) {

         inserted = true;
         PdfArray.push(pdfItem);
         pdfContentLayout.insertWidget(PdfArray.length - 1, pdfItem.ui.postItem);
         pdfItem.ui.postItem.show();
      }
   }
};

openWindow = function () {

   var index = 0;

   beenOpened = true;
   Object.keys(PdfItems).forEach(function (key) {

      if ((PdfItems[key].groups.indexOf(userGroupHandle) !== -1) && (indexOfPdfItem(PdfItems[key]) === -1)) {

         initiatePdfPostItemUi(PdfItems[key]);
         insertIntoScrollArea(PdfItems[key]);
      }
   });
};

checkNotifications = function () {

   Object.keys(PdfItems).forEach(function (key) {

      PdfItems[key].groups.forEach(function (groupHandle) {

         if ((groupHandle === userGroupHandle) && (PdfItems[key].viewed.indexOf(hil) === -1)) {

            MainModule.highlight("Newspaper");
         }
      });
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
   else if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] = { handle: objHandle };
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         checkNotifications();
         clearLayout();

         PdfArray = [];
         CurrentPdf = 0;
         pdfWebView.setHtml("");
         Object.keys(PdfItems).forEach(function (key) {

            if (PdfItems[key].ui) { delete PdfItems[key].ui; }
         });
         Object.keys(Groups).forEach(function (key) {

            if (Groups[key].ui) { delete Groups[key].ui; }
         });
         if (dmz.stance.isAllowed(hil, dmz.stance.SwitchGroupFlag)) {
            Object.keys(Groups).forEach(function (key) {

               if (!Groups[key].ui) {

                  Groups[key].ui = {};
                  Groups[key].ui.nameLabel = dmz.ui.label.create("<b>" + Groups[key].name + "</b>");
                  Groups[key].ui.checkBox = dmz.ui.button.createCheckBox();
                  groupSelectionLayout.insertWidget(0, Groups[key].ui.nameLabel);
                  groupSelectionLayout.insertWidget(0, Groups[key].ui.checkBox);
                  if (key == userGroupHandle) { Groups[key].ui.checkBox.setChecked(true); }
                  else { Groups[key].ui.checkBox.setChecked(false); }
               }
               else {

                  if (key == userGroupHandle) { Groups[key].ui.checkBox.setChecked(true); }
                  else { Groups[key].ui.checkBox.setChecked(false); }
               }
            });
         }
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

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (PdfItems[objHandle]) {

      PdfItems[objHandle].active = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) {

      Groups[objHandle].name = newVal;
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {


   if (PdfItems[supHandle]) {

      PdfItems[supHandle].createdByHandle = subHandle;
      dmz.time.setTimer(self, function () {

         PdfItems[supHandle].createdBy = dmz.stance.getDisplayName(subHandle);
      });
   }
});

dmz.object.link.observe(self, dmz.stance.MediaHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (PdfItems[supHandle]) {

      if (dmz.object.type(subHandle).isOfType(dmz.stance.GroupType)) {

         PdfItems[supHandle].groups.push(subHandle);
         dmz.time.setTimer(self, function () {

            if ((indexOfPdfItem(PdfItems[supHandle]) === -1) && beenOpened){

               initiatePdfPostItemUi(PdfItems[supHandle]);
               insertIntoScrollArea(PdfItems[supHandle]);
               if (PdfItems[supHandle].viewed.indexOf(hil) === -1) {

                  MainModule.highlight("Newspaper");
               }
            }
         });
      }
      else if (dmz.object.type(subHandle).isOfType(dmz.stance.UserType)) {

         PdfItems[supHandle].viewed.push(subHandle);
      }
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Newspaper", pdfViewer, openWindow, checkNotifications);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   scrollFormContent.layout(pdfContentLayout);
   pdfContentLayout.addStretch(1);
   groupSelectionLayout.addStretch(1);
};

init();
