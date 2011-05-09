require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , stackedWidget: require("dmz/ui/stackedWidget")
      , graph: require("dmz/ui/graph")
      , widget: require("dmz/ui/widget")
      , event: require("dmz/ui/event")
      , label: require("dmz/ui/label")
      , webview: require("dmz/ui/webView")
      , inputDialog: require("dmz/ui/inputDialog")
      }
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , stance: require("stanceConst")
   , vector: require("dmz/types/vector")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , sys: require("sys")
   }

   // UI Elements
   , main = dmz.ui.loader.load("main")
   , groupBox = main.lookup("groupBox")
   , stackedWidget = main.lookup("stackedWidget")
   , mainGView = main.lookup("graphicsView")
   , gscene
   , homeButton = main.lookup("homeButton")

   // Variables
   , GroupList = [-1]
   , AdvisorCount = 5
   , windowWidth = self.config.number("window.width", 1280)
   , windowHeight = self.config.number("window.height", 800)
   , advisors = []
   , map
   , newspaper
   , inbox
   , desk
   , tv
   , computer
   , LastWindow = false
   , Background
   , PageLink =
        { Map: false
        , Forum: false
        , Video: false
        , Newspaper: false
        , Memo: false
        , Advisor0: false
        , Advisor1: false
        , Advisor2: false
        , Advisor3: false
        , Advisor4: false
        , Lobbyist: false
        , Vote: false
        , Exit: false
        }
   , Calendar = false
   , CalendarText = { month: false, day: false, year: false }
   , LoggedIn = false
   , groupAdvisors = {}
   , advisorPicture = {}
   , HomeIndex = 0
   , SplashIndex = 1
   , LastGViewSize = false

   // Messages
   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , LoginFailedMessage = dmz.message.create("Login_Failed_Message")

   // Function decls
   , setupMainWindow
   , mouseEvent
   , updateGraphicsForGroup
   , setPixmapFromResource

   // API
   , _exports = {}
   ;

self.shutdown = function () {

   var hil = dmz.object.hil();
   if (dmz.object.flag(hil, dmz.stance.AdminHandle)) {

      dmz.object.unlinkSuperObjects(hil, dmz.stance.GroupMembersHandle);
   }

   if (mainGView) { mainGView.removeEventFilter(); }
   if (gscene) { gscene.removeEventFilter(); }
};

setPixmapFromResource = function (graphicsItem, resourceName) {

   var file = dmz.resources.findFile(resourceName)
     , config = dmz.resources.lookupConfig(resourceName)
     , loc
     , pixmap
     ;

   if (graphicsItem && config && file) {

      loc = config.vector("loc");
      pixmap = dmz.ui.graph.createPixmap(file);
      if (pixmap) { graphicsItem.pixmap(pixmap); }
      if (dmz.vector.isTypeOf(loc)) { graphicsItem.pos(loc.x, loc.y); }
   }
};

updateGraphicsForGroup = function (groupHandle) {

   var data
     , advisorKey = ["Advisor0", "Advisor1", "Advisor2", "Advisor3", "Advisor4"]
     , index
     , count
     ;

   if (groupHandle && dmz.object.type(groupHandle).isOfType(dmz.stance.GroupType)) {

      setPixmapFromResource(
         Background, dmz.object.text(groupHandle, dmz.stance.BackgroundImageHandle));
      setPixmapFromResource(
         Calendar, dmz.object.text(groupHandle, dmz.stance.CalendarImageHandle));

      data = dmz.object.data(groupHandle, dmz.stance.AdvisorImageHandle);
      count = dmz.object.scalar(groupHandle, dmz.stance.AdvisorImageCountHandle);
      if (data) {

         for (index = 0; index < count; index += 1) {

            setPixmapFromResource(
               PageLink[advisorKey[index]],
               data.string(dmz.stance.AdvisorImageHandle, index)
               );
         }
      }

      Object.keys(PageLink).forEach(function (key) {

         var item
           , attr
           ;

         switch (key) {
         case "Advisor0":
         case "Advisor1":
         case "Advisor2":
         case "Advisor3":
         case "Advisor4": break; // Handled above
         case "Exit": attr = dmz.stance.ExitImageHandle; break;
         case "Forum": attr = dmz.stance.ComputerImageHandle; break;
         case "Map": attr = dmz.stance.MapImageHandle; break;
         case "Video": attr = dmz.stance.TVImageHandle; break;
         case "Newspaper": attr = dmz.stance.NewspaperImageHandle; break;
         case "Memo": attr = dmz.stance.InboxImageHandle; break;
         case "Lobbyist": attr = dmz.stance.PhoneImageHandle; break;
         case "Resource": attr = dmz.stance.ResourceImageHandle; break;
         case "Vote": attr = dmz.stance.VoteImageHandle; break;
         default: self.log.warn ("Key ("+key+") has no associated handle."); break;
         }

         if (attr) {

            setPixmapFromResource(PageLink[key], dmz.object.text(groupHandle, attr));
         }
      });

      if (LoggedIn) { stackedWidget.currentIndex(HomeIndex); }
   }
};

mouseEvent = function (object, event) {

   var type = event.type()
     , pos
     , items
     ;

   if (object == gscene) {

      if (type == dmz.ui.event.GraphicsSceneMouseDoubleClick) {

//         self.log.warn ("Double click");
      }
      else if (type == dmz.ui.event.GraphicsSceneMousePress) {

//         self.log.warn ("Mouse click");
         pos = event.scenePos();
         items =
            object.items(pos, dmz.ui.consts.IntersectsItemShape, dmz.ui.consts.DescendingOrder);
         items.forEach(function (item) {

            var widget = item.data(0)
              , onChangeFunction = item.data(1)
              , children = item.childItems()
              ;

            if (stackedWidget && widget) {

               stackedWidget.currentWidget(widget);
               LastWindow = item;
            }
            if (onChangeFunction) { onChangeFunction(); }
            if (children) { children.forEach (function (child) { child.hide(); }); }
         });

      }
      else if (type == dmz.ui.event.GraphicsSceneMouseRelease) {}
      else if (type == dmz.ui.event.GraphicsSceneMouseMove) {}
   }
   return false;

};

dmz.object.link.observe(self, dmz.stance.GameGroupHandle,
function (objHandle, attrHandle, gameHandle, groupHandle) {

   GroupList.push(groupHandle);
   groupBox.addItem(dmz.stance.getDisplayName(groupHandle));
});

groupBox.observe(self, "currentIndexChanged", function (index) {

   var hil = dmz.object.hil();

   dmz.object.unlinkSuperObjects(hil, dmz.stance.GroupMembersHandle);
   if (index && (index < GroupList.length)) {

      dmz.object.link(dmz.stance.GroupMembersHandle, GroupList[index], hil);
      dmz.object.flag(hil, dmz.object.HILAttribute, false);
      dmz.object.flag(hil, dmz.object.HILAttribute, true);
   }
   else if (!index && stackedWidget) { stackedWidget.currentIndex(SplashIndex); }
});


dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      if (dmz.object.flag(objHandle, dmz.stance.AdminHandle)) {

         groupBox.show();
         groupBox.enabled(true);
      }
      else {

         groupBox.hide();
         groupBox.enabled(false);
      }

      updateGraphicsForGroup(dmz.stance.getUserGroupHandle(objHandle));

      Object.keys(PageLink).forEach(function (item) {

         var children;
         if (PageLink[item]) {

            children = PageLink[item].childItems();
            if (children) { children.forEach(function (item) { item.hide(); }); }
         }
      });
   }
});

dmz.object.unlink.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, userHandle) {

   if (userHandle === dmz.object.hil()) {

      var children;
      Object.keys(PageLink).forEach(function (item) {

         var children;
         if (PageLink[item]) {

            children = PageLink[item].childItems();
            if (children) { children.forEach(function (item) { item.hide(); }); }
         }
      });
   }
});

setupMainWindow = function () {

   var layout
     , gview
     , idx
     , length
     , box
     , widget
     , lobbyist
     , imageList = self.config.get("set.image")
     , highlight
     , file
     , pixmap
     , rect
     ;

   if (main && stackedWidget && mainGView) {

      gscene = dmz.ui.graph.createScene();
      mainGView.scene(gscene);

      file = dmz.resources.findFile(self.config.string("splash.name"));
      if (file) { main.lookup("splashLabel").pixmap(dmz.ui.graph.createPixmap(file)); }
      stackedWidget.currentIndex(SplashIndex);

      file = dmz.resources.findFile(self.config.string("set.background"));
      highlight = dmz.resources.findFile(self.config.string("set.highlight"));
      if (file) {

         pixmap = dmz.ui.graph.createPixmap(file);
         if (pixmap) {

            pixmap = gscene.addPixmap(pixmap);
            pixmap.pos(0, 0);
            Background = pixmap;
         }
      }
      imageList.forEach(function (image) {

         var name = image.string("name")
           , resource = image.string("resource")
           , file
           , config
           , loc
           , offset
           , pixmap
           , widget
           ;

         if (name && resource) {

            file = dmz.resources.findFile(resource)
            config = dmz.resources.lookupConfig(resource)
            if (config) {

               loc = config.vector("loc");
               if (dmz.vector.isTypeOf(loc)) {

                  pixmap = dmz.ui.graph.createPixmap(file);
                  if (pixmap) {

                     pixmap = gscene.addPixmap(pixmap);
                     pixmap.pos(loc.x, loc.y);
                     if (name === "Calendar") { Calendar = pixmap; }
                     else {

                        widget = dmz.ui.label.create(name);
                        pixmap.data(0, widget);
                        stackedWidget.add(widget);
                        PageLink[name] = pixmap;
                        if (highlight) {

                           pixmap = dmz.ui.graph.createPixmap(highlight);
                           pixmap = dmz.ui.graph.createPixmapItem(pixmap, PageLink[name]);
                           offset = config.vector("offset");
                           if (dmz.vector.isTypeOf(offset)) { pixmap.pos(offset.x, offset.y); }
                           pixmap.hide();
                        }
                     }
                  }
               }
            }
         }
      });

      _exports.addPage("Exit", false, function () {

         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Warning
            , text: "Are you sure you wish to exit?"
            , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Cancel
            }
            , main
         ).open(self, function (value) {

            if (value === dmz.ui.messageBox.Ok) { dmz.sys.requestExit(); }
         });
      });

      homeButton.observe(self, "clicked", function () {

         var item = LastWindow
           , func
           ;

         stackedWidget.currentIndex (HomeIndex);
         if (item) {

           func = item.data(2);
           if (func) { func(); }
         }
      });

      gscene.eventFilter(self, mouseEvent);
      dmz.ui.mainWindow.centralWidget(main);
      mainGView.eventFilter(self, function (object, event) {

         var type = event.type()
           , size
           , oldSize
           ;

         if (type == dmz.ui.event.Resize) {

            size = event.size();
            if (!LastGViewSize) { oldSize = mainGView.sceneRect(); }
            else { oldSize = LastGViewSize; }
            LastGViewSize = size;
            mainGView.scale(size.width / oldSize.width, size.height / oldSize.height);
         }
      });
   }
};

_exports.addPage = function (name, widget, func, onHome) {

   if (name && stackedWidget && PageLink[name]) {

      stackedWidget.remove(PageLink[name].data(0));
      stackedWidget.add(widget);
      PageLink[name].data(0, widget);
      PageLink[name].data(1, func);
      PageLink[name].data(2, onHome);
      PageLink[name].cursor(dmz.ui.consts.PointingHandCursor);
   }
   else { self.log.error (name, widget, stackedWidget, PageLink[name]); }
};

_exports.highlight = function (name) {

   var children;
   if (name && PageLink[name]) {

      children = PageLink[name].childItems();
      if (children) { children.forEach(function (item) { item.show(); }) }
   }
};

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, groupHandle, advisorHandle) {

   if (!groupAdvisors[groupHandle]) { groupAdvisors[groupHandle] = []; }
   if (groupAdvisors[groupHandle].length <= AdvisorCount) {

      groupAdvisors[groupHandle].push(advisorHandle);
      if (!advisorPicture[advisorHandle]) {

         advisorPicture[advisorHandle] =
            { loc: dmz.object.position(advisorHandle, dmz.stance.PictureHandle)
            };

         advisorPicture[advisorHandle].file =
            dmz.resources.findFile(dmz.object.text(advisorHandle, dmz.stance.PictureHandle));
      }
   }
});

dmz.object.flag.observe(self, dmz.stance.AdminHandle,
function (objHandle, attrHandle, value) {

   if (value && (objHandle === dmz.object.hil())) {

      groupBox.show();
      groupBox.enabled(true);
   }
   else {

      groupBox.hide();
      groupBox.enabled(false);
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (objHandle, attrHandle, groupHandle, userHandle) {

   if (userHandle === dmz.object.hil()) { updateGraphicsForGroup(groupHandle); }
});

(function () {

   groupBox.hide();
   groupBox.enabled(false);
   setupMainWindow();
   if (!self.config.number("login.value", 0)) {

      dmz.time.setTimer(self, 2, function () {

         if (!LoggedIn && stackedWidget) { stackedWidget.currentIndex(HomeIndex); LoggedIn = true; }
      });
   }
}());

LoginSuccessMessage.subscribe(self, function () {

   self.log.warn ("Login Success, logged in");
   LoggedIn = true;
});

LoginFailedMessage.subscribe(self, function () { LoggedIn = true; });

dmz.module.subscribe(self, "game-time", function (Mode, module) {

   var timeStamp;
   if (Mode === dmz.module.Activate) {

      timeStamp = dmz.util.timeStampToDate(module.gameTime());
      if (!Calendar) {

         CalendarText.month = gscene.addText(timeStamp.toString("MMM"));
         CalendarText.month.pos(810, 345);
      }
      else {

         CalendarText.month = dmz.ui.graph.createTextItem(timeStamp.toString("MMM"), Calendar);
      }
      CalendarText.day = dmz.ui.graph.createTextItem(timeStamp.toString("dd"), CalendarText.month);
      CalendarText.year = dmz.ui.graph.createTextItem(timeStamp.toString("yyyy"), CalendarText.day);
      CalendarText.month.pos(55, 15);
      CalendarText.day.pos(10, 30);
      CalendarText.year.pos(-15, 30);

      Object.keys(CalendarText).forEach(function (name) {

         CalendarText[name].font(
            { font: "Times"
            , size: 30
            , weight: 75
            });
      });
      dmz.time.setRepeatingTimer(self, 60, function () {

         var date;
         if (dmz.object.hil()) {

            date = dmz.util.timeStampToDate(module.gameTime());
            CalendarText.month.plainText(date.toString("MMM"));
            CalendarText.day.plainText(date.toString("dd"));
            CalendarText.year.plainText(date.toString("yyyy"));
         }
      });
   }
});

dmz.module.publish(self, _exports);
