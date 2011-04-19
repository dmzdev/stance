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
   , resources: require("dmz/runtime/resources")
   , stance: require("stanceConst")
   , vector: require("dmz/types/vector")
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
   , sceneWidth = self.config.number("scene.width", 1280)
   , sceneHeight = self.config.number("scene.height", 800)
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
        }
   , groupAdvisors = {}
   , advisorPicture = {}

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
};

setPixmapFromResource = function (graphicsItem, resourceName) {

   var file = dmz.resources.findFile(resourceName)
     , config = dmz.resources.lookupConfig(resourceName)
     , loc
     , pixmap
     ;

   if (graphicsItem && config && file) {

      loc = config.vector("loc");
      if (dmz.vector.isTypeOf(loc)) {

         if (dmz.vector.isTypeOf(loc)) {

            pixmap = dmz.ui.graph.createPixmap(file);
            if (pixmap) {

               graphicsItem.pixmap(pixmap);
               graphicsItem.pos(loc.x, loc.y);
            }
         }
      }
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
   //         case "background": attr = dmz.stance.BackgroundImageHandle; break;
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

         var children = PageLink[item].childItems();
         if (children) { children.forEach(function (item) { item.hide(); }); }
      });
   }
});

dmz.object.unlink.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, userHandle) {

   if (userHandle === dmz.object.hil()) {

      Object.keys(PageLink).forEach(function (item) {

         var children = PageLink[item].childItems();
         if (children) { children.forEach(function (item) { item.hide(); }); }
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

//      rect = mainGView.sceneRect
//      gscene = dmz.ui.graph.createScene(0, 0, sceneHeight, sceneWidth);
      gscene = dmz.ui.graph.createScene();
      mainGView.scene(gscene);
      stackedWidget.remove(1); // Get rid of Qt Designer-forced second page

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
                     widget = dmz.ui.label.create(name);
                     pixmap.data(0, widget);
                     stackedWidget.add(widget);
                     PageLink[name] = pixmap;
                     if (highlight) {

                        pixmap = dmz.ui.graph.createPixmap(highlight);
                        pixmap = dmz.ui.graph.createPixmapItem(pixmap, PageLink[name]);
                        offset = config.vector("offset")
                        if (dmz.vector.isTypeOf(offset)) { pixmap.pos(offset.x, offset.y); }
                        pixmap.hide();
                     }
                  }
               }
            }
         }
      });

      homeButton.observe(self, "clicked", function () {

         var item = LastWindow
           , func
           ;

         stackedWidget.currentIndex (0);
         if (item) {

           func = item.data(2);
           if (func) { func(); }
         }
      });

      stackedWidget.currentIndex(0);
      gscene.eventFilter(self, mouseEvent);
      dmz.ui.mainWindow.centralWidget(main);
      mainGView.eventFilter(self, function (object, event) {

         var type = event.type()
           , size
           , oldSize
           ;

         if (type == dmz.ui.event.Resize) {

            size = event.size();
            oldSize = event.oldSize();
            if (!oldSize || !((oldSize.width > 0) && (oldSize.height > 0))) {

               oldSize = mainGView.sceneRect();
            }

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

   var file;
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
   if (dmz.stance.getUserGroupHandle(dmz.object.hil()) === groupHandle) {

//      updateGraphicsForGroup(groupHandle);
   }
});

dmz.object.flag.observe(self, dmz.stance.AdminHandle,
function (objHandle, attrHandle, value) {

   var groupHandle = dmz.stance.getUserGroupHandle(objHandle)
     , index = -1
     ;

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

   self.log.warn ("GroupMembersHandle");
   if (userHandle === dmz.object.hil()) { updateGraphicsForGroup(groupHandle); }
});

(function () {

   groupBox.hide();
   groupBox.enabled(false);
   setupMainWindow();
}());

dmz.module.publish(self, _exports);
