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
   , data: require("dmz/runtime/data")
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
   , mediaViewer = dmz.ui.loader.load("MediaDialog.ui")
   , mediaScrollArea = mediaViewer.lookup("mediaScrollArea")
   , scrollFormContent = mediaScrollArea.widget()
   , mediaContentLayout = dmz.ui.layout.createVBoxLayout()
   , groupSelectionLayout = mediaViewer.lookup("groupSelectionLayout")
   , mediaWebView = dmz.ui.webview.create()
   , errorLabel = mediaViewer.lookup("errorLabel")
   , addMediaButton = mediaViewer.lookup("addMediaButton")
   , addWidget = mediaViewer.lookup("addWidget")
   , titleTextEdit = mediaViewer.lookup("titleTextEdit")
   , linkTextEdit = mediaViewer.lookup("linkTextEdit")
   , titleTextLabel = mediaViewer.lookup("titleTextLabel")
   , linkTextLabel = mediaViewer.lookup("linkTextLabel")
   , tagButton = mediaViewer.lookup("tagButton")
   , deleteButton = mediaViewer.lookup("deleteButton")
   , cancelButton = mediaViewer.lookup("cancelButton")
   , addLinkWidget = mediaViewer.lookup("addLinkWidget")
   , addMediaCheckBox = mediaViewer.lookup("addMediaCheckBox")

   // Variables
   , hil
   , beenOpened = false
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , canSeeTags = false
   , userGroupHandle
   , currentGameHandle
   , Groups = {}
   , PdfItems = {}
   , Memos = {}
   , Newspapers = {}
   , Videos = {}
   , PdfArray = []
   , MemosArray = []
   , NewspapersArray = []
   , VideosArray = []
   , CurrentMap = {}
   , CurrentArray = []
   , TypesMap =
      { "PdfItem": dmz.stance.PdfItemType
      , "Memo": dmz.stance.MemoType
      , "Newspaper": dmz.stance.NewspaperType
      , "Video": dmz.stance.VideoType
      }
   , MediaTypes =
        { "Video":
           { type: dmz.stance.VideoType
           , urlEnd: "www.youtube.com"
           , UI: "Video"
           }
        , "Memo":
           { type: dmz.stance.MemoType
           , urlEnd: "?stance:view&id="
           , UI: "Memo"
           }
        , "Newspaper":
           { type: dmz.stance.NewspaperType
           , urlEnd: "?stance:view&id="
           , UI: "Newspaper"
           }
        , "PdfItem":
           { type: dmz.stance.PdfItemType
           , urlEnd: ".pdf"
           , UI: "Bookcase"
           }
        }
   , CurrentItem
   , CurrentType
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Functions
   , changeState
   , initialButtonObserve
   , clickDelete
   , confirmDelete
   , clickCancel
   , mouseEventHandler
   , mouseEvent
   , setTagLabels
   , clearLayout
   , clearGroupSelectionLayout
   , initiateMediaPostItemUi
   , removeFromScrollArea
   , indexOfMediaItem
   , insertIntoScrollArea
   , setGroupCheckboxes
   , openWindow
   , checkNotifications
   , exitFunction
   , init
   ;

changeState = function (state) {

   CurrentItem = 0;
   clearLayout();
   mediaWebView.setHtml("");
   PdfArray = [];
   MemosArray = [];
   NewspapersArray = [];
   VideosArray = [];
   CurrentType = state;
   if (state === "PdfItem") {

      CurrentMap = PdfItems;
      CurrentArray = PdfArray;
      addMediaButton.text("Add PDF Link");
   }
   else if (state === "Memo") {

      CurrentMap = Memos;
      CurrentArray = MemosArray;
      addMediaButton.text("Add Memo Link");
   }
   else if (state === "Newspaper") {

      CurrentMap = Newspapers;
      CurrentArray = NewspapersArray;
      addMediaButton.text("Add Newspaper Link");
   }
   else if (state === "Video") {

      CurrentMap = Videos;
      CurrentArray = VideosArray;
      addMediaButton.text("Add Video Link");
   }
};

initialButtonObserve = function () {

   var isAllowedToDelete = false
     , isAllowedToPost = false
     ;

   if (dmz.stance.isAllowed(hil, dmz.stance.TagDataFlag) && !LoginSkipped) { tagButton.show(); }
   else { tagButton.hide(); }
   if ((CurrentType === "PdfItem") && dmz.stance.isAllowed(hil, dmz.stance.InjectPDFFlag) &&
      !LoginSkipped) {

      isAllowedToPost = true;
      if (CurrentItem.createdByHandle === hil) { isAllowedToDelete = true; }
   }
   else if (dmz.stance.isAllowed(hil, dmz.stance.AlterMediaFlag) && !LoginSkipped) {

      isAllowedToDelete = true;
      isAllowedToPost = true;
   }
   if (isAllowedToDelete) {

      deleteButton.observe(self, "clicked", function () { clickDelete(); });
      cancelButton.hide();
      deleteButton.show();
   }
   else {

      cancelButton.hide();
      deleteButton.hide();
   }
   if (isAllowedToPost) {

      linkTextEdit.show();
      linkTextLabel.show();
      titleTextEdit.show();
      titleTextLabel.show();
      addMediaButton.show();
      addMediaCheckBox.show();
      addWidget.show();
   }
   else {

      linkTextEdit.hide();
      linkTextLabel.hide();
      titleTextEdit.hide();
      titleTextLabel.hide();
      addMediaButton.hide();
      addMediaCheckBox.hide();
      addWidget.hide();
   }
};

clickDelete = function () {

   if (CurrentItem) {

      if (dmz.stance.isAllowed(hil, dmz.stance.TagDataFlag)) { tagButton.hide(); }
      cancelButton.show();
      deleteButton.observe(self, "clicked", confirmDelete);
      cancelButton.observe(self, "clicked", clickCancel);
//      deleteButton.observe(self, "clicked", function () { confirmDelete() });
//      cancelButton.observe(self, "clicked", function () { clickCancel() });
   }
};

confirmDelete = function () {

   if (CurrentItem) {

      dmz.object.flag(CurrentItem.handle, dmz.stance.ActiveHandle, false);
      removeFromScrollArea(CurrentItem);
      CurrentItem = 0;
      mediaWebView.setHtml("");
      initialButtonObserve();
   }
};

clickCancel = function () { initialButtonObserve(); };

tagButton.observe(self, "clicked", function () {

   if (CurrentItem) { dmz.stance.TAG_MESSAGE.send(dmz.data.wrapHandle(CurrentItem.handle)); }
});

addMediaButton.observe(self, "clicked", function () {

   var mediaItemHandle
     , atLeastOneChecked = false
     ;

   if ((titleTextEdit.text() !== "") && (linkTextEdit.text() !== "") &&
      dmz.stance.isAllowed(hil, dmz.stance.InjectPDFFlag)) {

      if (linkTextEdit.text().lastIndexOf(MediaTypes[CurrentType].urlEnd) !== -1) {

         if (((CurrentType === "PdfItem") && dmz.stance.isAllowed(hil, dmz.stance.InjectPDFFlag)) ||
            dmz.stance.isAllowed(hil, dmz.stance.AlterMediaFlag)) {

            mediaItemHandle = dmz.object.create(TypesMap[CurrentType]);
            dmz.object.text(mediaItemHandle, dmz.stance.TitleHandle, titleTextEdit.text());
            dmz.object.text(mediaItemHandle, dmz.stance.TextHandle, linkTextEdit.text());
            if (CurrentType === "PdfItem") {

               dmz.object.link(dmz.stance.CreatedByHandle, mediaItemHandle, hil);
            }
            dmz.object.link(dmz.stance.MediaHandle, mediaItemHandle, hil);
            dmz.object.link(dmz.stance.MediaHandle, mediaItemHandle, currentGameHandle);
            dmz.object.flag(mediaItemHandle, dmz.stance.UpdateStartTimeHandle, true);
            dmz.object.timeStamp(mediaItemHandle, dmz.stance.CreatedAtServerTimeHandle, 0);
            dmz.object.flag(mediaItemHandle, dmz.stance.ActiveHandle, true);
            if (dmz.stance.isAllowed(hil, dmz.stance.SwitchGroupFlag)) {

               Object.keys(Groups).forEach(function (key) {

                  if (Groups[key].ui && Groups[key].ui.checkBox && Groups[key].ui.checkBox.isChecked()) {

                     atLeastOneChecked = true;
                     dmz.object.link(dmz.stance.MediaHandle, mediaItemHandle, Groups[key].handle);
                  }
               });
            }
            else {

               atLeastOneChecked = true;
               dmz.object.link(dmz.stance.MediaHandle, mediaItemHandle, userGroupHandle);
            }
            if (atLeastOneChecked) {

               dmz.object.activate(mediaItemHandle);
               titleTextEdit.text("");
               linkTextEdit.text("");
               errorLabel.text("");
            }
         }
      } else {

         errorLabel.text("<font color=\"red\"> Invalid Link.</font>");
      }
   }
});

mouseEventHandler = function (object, event) { mouseEvent(object, event.type()); };

mouseEvent = function (object, type) {

   var youtubeVID;

   CurrentArray.forEach(function (mediaItem) {

      if ((object == mediaItem.ui.postItem) && (type == dmz.ui.event.MouseButtonPress) &&
         (CurrentItem != mediaItem)) {

         // set CurrentItem widget back to grey and change value to new widget
         if (CurrentItem) {

            CurrentItem.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
         }
         CurrentItem = mediaItem;
         initialButtonObserve();
         dmz.time.setTimer(self, function () {

            // link and set widget to dark grey (current)
            initialButtonObserve();
            dmz.object.link(dmz.stance.MediaHandle, mediaItem.handle, hil);
            mediaItem.ui.notificationLabel.hide();
            mediaItem.ui.postItem.styleSheet("* { background-color: rgb(180, 180, 180); border-style: solid; }");
            if (!LoginSkipped) {

               if ((CurrentType === "PdfItem") && mediaItem.link) {

                  mediaWebView.setHtml(
                     "<center><iframe src='http://docs.google.com/viewer?" +
                     "url=" + encodeURIComponent(mediaItem.link) +
                     "&embedded=true'" +
                     "width='" + (mediaWebView.page().width() - 20) +
                     "' height='" + (mediaWebView.page().height() - 20) +
                     "' style='border: none;'></iframe></center>");
               }
               else if ((CurrentType === "Video") && mediaItem.link) {

                  // add regex here to extract the vidID from mediaItem.link and
                  // make that in instead of mediaItem.link
                  youtubeVID = /v=[\w\-]+(?=&)?/.exec(mediaItem.link);
                  if (youtubeVID) {

                     youtubeVID = youtubeVID[0];
                     youtubeVID = youtubeVID.replace("v=", "");
                     mediaWebView.page().mainFrame().load(
                        "http://www.chds.us/?stance:youtube&video=" + youtubeVID +
                        "&width=" + (mediaWebView.page().width() - 20) +"&height=" + (mediaWebView.page().height() - 20));
                  }
               }
               else if (mediaItem.link) {

                  mediaWebView.page().mainFrame().load(mediaItem.link);
               }
            }
            else {

               mediaWebView.setHtml("<center><b>Can't load media when not logged in.</b></center>");
            }
         });
      }
      else if ((object == mediaItem.ui.postItem) && (type == dmz.ui.event.Enter)) {

         if (mediaItem.viewed.indexOf(hil) === -1) { // enter hasn't seen (redder)

            mediaItem.ui.postItem.styleSheet("* { background-color: rgb(190, 140, 140); border-style: solid; }");
         }
         else if (CurrentItem && CurrentItem.ui && (CurrentItem.ui.postItem == object)) {

            // Placeholder in case we want to make the hover chnge color for the current PDF
         }
         else { // enter seen (greyer)

            mediaItem.ui.postItem.styleSheet("* { background-color: rgb(180, 180, 180); border-style: solid; }");
         }
      }
      else if ((object == mediaItem.ui.postItem) && (type == dmz.ui.event.Leave)) {

         if (mediaItem.viewed.indexOf(hil) === -1) { // back to red

            mediaItem.ui.postItem.styleSheet("* { background-color: rgb(210, 180, 180); border-style: solid; }");
         }
         else if (CurrentItem && CurrentItem.ui && (CurrentItem.ui.postItem == object)) {

            // Also a placeholder for leeaving the currently displayed PDF
         }
         else { // back to grey

            mediaItem.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
         }
      }
   });
};

setTagLabels = function (mediaItem) {

   if (mediaItem && mediaItem.ui) {

      if (mediaItem.tags && mediaItem.tags.length && canSeeTags) {

         mediaItem.ui.tagLabel.show();
         mediaItem.ui.tagLabel.text(mediaItem.tags.toString());
         mediaItem.ui.postItem.fixedHeight(140);
      }
      else {

         mediaItem.ui.tagLabel.text("");
         mediaItem.ui.tagLabel.hide();
         mediaItem.ui.postItem.fixedHeight(120);
      }
   }
};

clearLayout = function () {

   var widget;

   if (scrollFormContent && mediaContentLayout) {

      widget = mediaContentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = mediaContentLayout.takeAt(0);
      }
      mediaContentLayout.addStretch(1);
   }
};

clearGroupSelectionLayout = function () {

   var widget;

   if (groupSelectionLayout) {

      widget = groupSelectionLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = groupSelectionLayout.takeAt(0);
      }
      groupSelectionLayout.addStretch(0);
   }
;}

initiateMediaPostItemUi = function (mediaItem) {

   if (mediaItem && !mediaItem.ui) {

      mediaItem.ui = {};
      mediaItem.ui.postItem = dmz.ui.loader.load("MediaPostItem.ui");
      mediaItem.ui.titleLabel = mediaItem.ui.postItem.lookup("titleLabel");
      mediaItem.ui.createdByLabel = mediaItem.ui.postItem.lookup("postedByLabel");
      mediaItem.ui.tagLabel = mediaItem.ui.postItem.lookup("tagLabel");
      mediaItem.ui.postedByHeaderLabel = mediaItem.ui.postItem.lookup("postedByHeaderLabel");
      mediaItem.ui.notificationLabel = dmz.ui.label.create(mediaItem.ui.postItem);
      mediaItem.ui.notificationLabel.fixedWidth(34);
      mediaItem.ui.titleLabel.text(mediaItem.title);
      if (mediaItem.createdByHandle && (mediaItem.createdByPermissions === dmz.stance.STUDENT_PERMISSION)) {

         mediaItem.ui.createdByLabel.text(mediaItem.createdBy);
      }
      else if (mediaItem.createdByHandle &&
         (mediaItem.createdByPermissions === dmz.stance.ADMIN_PERMISSION) || (mediaItem.createdByPermissions === dmz.stance.TECH_PERMISSION)) {

         mediaItem.ui.createdByLabel.hide();
         mediaItem.ui.postedByHeaderLabel.hide();
      }
      mediaItem.ui.postItem.eventFilter(self, mouseEventHandler);
      setTagLabels(mediaItem);
      if (mediaItem.viewed.indexOf(hil) === -1) { // not seen

         mediaItem.ui.notificationLabel.pixmap((dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify"))));
         mediaItem.ui.notificationLabel.move(5, 5);
         mediaItem.ui.titleLabel.raise();
         mediaItem.ui.titleLabel.styleSheet("* { background-color: rgba(0, 0, 0, 0); }");
         mediaItem.ui.postItem.styleSheet("* { background-color: rgb(210, 180, 180); border-style: solid; }");
      }
      else { // seen

         mediaItem.ui.notificationLabel.hide();
         mediaItem.ui.postItem.styleSheet("* { background-color: rgb(210, 210, 210); border-style: solid; }");
      }
   }
};

removeFromScrollArea = function (mediaItem) {

   var mediaItemIndex;

   if (mediaItem.ui) {

      mediaItemIndex = indexOfMediaItem(mediaItem);
      if (mediaItemIndex !== -1) {

         CurrentArray.splice(mediaItemIndex, 1);
         mediaItem.ui.postItem.hide();
         mediaContentLayout.removeWidget(mediaItem.ui.postItem);
      }
   }
};

indexOfMediaItem = function (mediaItem) {

   var itor
     , result = -1
     ;

   for (itor = 0; itor < CurrentArray.length; itor += 1) {

      if (CurrentArray[itor].handle === mediaItem.handle) { result = itor; }
   }
   return result;
};

insertIntoScrollArea = function (mediaItem) {

   var newStartTime
     , insertedStartTime
     , inserted = false
     , itor
     ;

   if (mediaItem.ui) {

      newStartTime = mediaItem.createdAt;
      if ((newStartTime === 0) || (CurrentArray.length === 0)) {

         inserted = true;
         if (CurrentArray.length === 0) { CurrentArray.push(mediaItem); }
         else { CurrentArray.splice(0, 0, mediaItem); }
         mediaContentLayout.insertWidget(0, mediaItem.ui.postItem);
         mediaItem.ui.postItem.show();
      }
      for (itor = 0; itor < CurrentArray.length; itor += 1) {

         if (!inserted) {

            insertedStartTime = CurrentArray[itor].createdAt;
            if (newStartTime >= insertedStartTime) {

               inserted = true;
               if (CurrentArray.length === 0) { CurrentArray.push(mediaItem); }
               else { CurrentArray.splice(itor, 0, mediaItem); }
               mediaContentLayout.insertWidget(itor, mediaItem.ui.postItem);
               mediaItem.ui.postItem.show();
            }
         }
      }
      if (!inserted) {

         inserted = true;
         CurrentArray.push(mediaItem);
         mediaContentLayout.insertWidget(CurrentArray.length - 1, mediaItem.ui.postItem);
         mediaItem.ui.postItem.show();
      }
   }
};

setGroupCheckboxes = function () {

   Object.keys(Groups).forEach(function (key) {

      if (!Groups[key].ui) {

         Groups[key].ui = {};
         Groups[key].ui.checkBox = dmz.ui.button.createCheckBox(Groups[key].name);
         groupSelectionLayout.insertWidget(0, Groups[key].ui.checkBox);
         if (key == userGroupHandle || CurrentType === "Newspaper") {

            Groups[key].ui.checkBox.setChecked(true);
         }
         else { Groups[key].ui.checkBox.setChecked(false); }
      }
      else {

         if (key == userGroupHandle || CurrentType === "Newspaper") {

            Groups[key].ui.checkBox.setChecked(true);
         }
         else { Groups[key].ui.checkBox.setChecked(false); }
      }
   });
};

openWindow = function () {

   var index = 0;

   beenOpened = true;
   titleTextEdit.text("");
   linkTextEdit.text("");
   errorLabel.text("");
   initialButtonObserve();
   Object.keys(CurrentMap).forEach(function (key) {

      if ((CurrentMap[key].groups.indexOf(userGroupHandle) !== -1) && (indexOfMediaItem(CurrentMap[key]) === -1) &&
         CurrentMap[key].active) {

         initiateMediaPostItemUi(CurrentMap[key]);
         insertIntoScrollArea(CurrentMap[key]);
      }
   });
   setGroupCheckboxes();
   if (CurrentArray && CurrentArray[0]) {

      mouseEvent(CurrentArray[0].ui.postItem, dmz.ui.event.MouseButtonPress);
   }
   else { mediaWebView.setHtml("<center><b>No Current Items</b></Center>"); }
};

checkNotifications = function () {

   var list = { "PdfItem": PdfItems, "Memo": Memos, "Newspaper": Newspapers, "Video": Videos };
   Object.keys(list).forEach(function (listKey) {

      var data = list[listKey];
      Object.keys(data).forEach(function (key) {

         data[key].groups.forEach(function (groupHandle) {

            if ((groupHandle == userGroupHandle) && (data[key].viewed.indexOf(hil) === -1) &&
               data[key].active) {

               MainModule.highlight(data[key].type.UI);
            }
         });
      });
   });
};

exitFunction = function () {

   checkNotifications();
   addMediaCheckBox.setChecked(true);
   mediaWebView.setHtml("<Center><b>Loading...</b></center>");
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.PdfItemType)) {

      PdfItems[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         , tags: []
         , type: MediaTypes.PdfItem
         };
   }
   else if (objType.isOfType(dmz.stance.MemoType)) {

      Memos[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         , tags: []
         , type: MediaTypes.Memo
         , createdBy: "Admin"
         };
   }
   else if (objType.isOfType(dmz.stance.NewspaperType)) {

      Newspapers[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         , tags: []
         , type: MediaTypes.Newspaper
         , createdBy: "Admin"
         };
   }
   else if (objType.isOfType(dmz.stance.VideoType)) {

      Videos[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         , tags: []
         , type: MediaTypes.Video
         , createdBy: "Admin"
         };
   }
   else if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] = { handle: objHandle };
   }
   else if (objType.isOfType(dmz.stance.GameType)) { currentGameHandle = objHandle; }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         checkNotifications();
         clearLayout();
         clearGroupSelectionLayout();
         tagButton.hide();
         deleteButton.hide();
         cancelButton.hide();

         PdfArray = [];
         MemosArray = [];
         NewspapersArray = [];
         VideosArray = [];
         CurrentItem = 0;
         mediaWebView.setHtml("");
         canSeeTags = dmz.stance.isAllowed(objHandle, dmz.stance.SeeTagFlag);
         Object.keys(PdfItems).forEach(function (key) {

            if (PdfItems[key].ui) { delete PdfItems[key].ui; }
         });
         Object.keys(Groups).forEach(function (key) {

            if (Groups[key].ui) { delete Groups[key].ui; }
         });
         if (dmz.stance.isAllowed(hil, dmz.stance.InjectPDFFlag)) {

            addLinkWidget.show();
            addMediaButton.show();
         }
         else {

            addLinkWidget.hide();
            addMediaButton.hide();
         }
         if (dmz.stance.isAllowed(hil, dmz.stance.SwitchGroupFlag)) {

            initialButtonObserve();
            setGroupCheckboxes();
         }
      });
   }
});

dmz.object.data.observe(self, dmz.stance.TagHandle,
function (objHandle, attrHandle, data) {

   var data = PdfItems[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle];
   if (data) {

      data.tags = dmz.stance.getTags(data);
      setTagLabels(data);
   }
});

dmz.object.text.observe(self, dmz.stance.TitleHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = PdfItems[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle];
   if (data) { data.title = newVal; }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = PdfItems[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle];
   if (data) { data.link = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = PdfItems[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle];
   if (data) { data.createdAt = newVal; }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = PdfItems[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle];
   if (data) {

      data.active = newVal;
      if (newVal && !oldVal) { checkNotifications(); }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) { Groups[objHandle].name = newVal; }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var data = PdfItems[supHandle] || Memos[supHandle] || Newspapers[supHandle] || Videos[supHandle];
   if (data) {

      data.createdByHandle = subHandle;
      data.createdBy = dmz.stance.getDisplayName(subHandle);
      data.createdByPermissions = dmz.object.scalar(subHandle, dmz.stance.Permissions);
   }
});

dmz.object.link.observe(self, dmz.stance.MediaHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var data = PdfItems[supHandle] || Memos[supHandle] || Newspapers[supHandle] || Videos[supHandle];
   if (data) {

      if (dmz.object.type(subHandle).isOfType(dmz.stance.GroupType)) {

         data.groups.push(subHandle);
         dmz.time.setTimer(self, function () {

            if ((data[supHandle].viewed.indexOf(hil) === -1) && data.active &&
               (data.groups.indexOf(userGroupHandle) !== -1)) {

               MainModule.highlight(data.type.UI);
            }
            if ((indexOfMediaItem(data) === -1) && beenOpened) {

               initiateMediaPostItemUi(data);
               insertIntoScrollArea(data);
            }
         });
      }
      else if (dmz.object.type(subHandle.isOfType(dmz.stance.UserType))) {

         data.viewed.push(subHandle);
      }
   }
});

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list
     , uiItem = mediaViewer
     ;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      Object.keys(MediaTypes).forEach(function (key) {

         module.addPage
            ( MediaTypes[key].UI
            , uiItem
            , function () { changeState(key); openWindow(); }
            , exitFunction
            );
         uiItem = "Video";
      });
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   var pic
     , parent
     ;

   mediaViewer.lookup("mainViewLayout").addWidget(mediaWebView);
   scrollFormContent.layout(mediaContentLayout);
   mediaContentLayout.addStretch(1);
   groupSelectionLayout.addStretch(1);
   tagButton.hide();
   pic = dmz.ui.graph.createPixmap(dmz.resources.findFile("tagButton"));
   if (pic) { tagButton.setIcon(pic); }
   tagButton.styleSheet(dmz.stance.YELLOW_BUTTON);
   deleteButton.hide();
   deleteButton.styleSheet(dmz.stance.RED_BUTTON);
   cancelButton.hide();
   cancelButton.styleSheet(dmz.stance.GREEN_BUTTON);
};

init();
