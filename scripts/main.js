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
   }

   // UI Elements
//   , setGroupsForm = dmz.ui.loader.load("SetGroupsForm.ui")
//   , doneButton = setGroupsForm.lookup("doneButton")
//   , createGroupDialog = dmz.ui.loader.load("CreateGroupDialog.ui")

   , main = dmz.ui.loader.load("main")
   , stackedWidget = main.lookup("stackedWidget")
   , mainGView = main.lookup("graphicsView")
   , gscene
   , homeButton = main.lookup("homeButton")

   // Handles

   // Object Types

   // Variables
   , AdvisorCount = 6
   , sceneWidth = self.config.number("scene.width", 800)
   , sceneHeight = self.config.number("scene.height", 400)

   , advisors = []
   , map
   , newspaper
   , inbox
   , desk
   , tv
   , computer
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
      }

   // Function decls
   , setupMainWindow
   , mouseEvent

   // API
   , _exports = {}
   ;

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
              , onChangeFunction = item.data(1);
              ;

            if (stackedWidget && widget) {

               stackedWidget.currentWidget(widget);
               if (onChangeFunction) { onChangeFunction(); }
            }
         });

      }
      else if (type == dmz.ui.event.GraphicsSceneMouseRelease) {


      }
      else if (type == dmz.ui.event.GraphicsSceneMouseMove) {


      }
   }
   return false;

}

setupMainWindow = function () {

   var layout
     , gview
     , idx
     , length
     , box
     , widget
     ;

   if (main && stackedWidget && mainGView) {

      gscene = dmz.ui.graph.createScene(0, 0, sceneHeight, sceneWidth);
      mainGView.scene(gscene);
      stackedWidget.remove(1); // Get rid of Qt Designer-forced second page

      for (idx = 0; idx < AdvisorCount; idx += 1) {

         box = gscene.addRect(0, 0, 100, 100);
         box.pos (2 * idx * 100, 0);
         dmz.ui.graph.createTextItem("Advisor #" + (idx + 1), box);
         advisors.push(box);
      }

      map = dmz.ui.graph.createRectItem(0, 0, 60, 60, advisors[0]);
      map.pos(0, 150);
      dmz.ui.graph.createTextItem("Map", map);

      tv = dmz.ui.graph.createRectItem(0, 0, 60, 60, advisors[AdvisorCount - 1]);
      tv.pos (40, 150);
      dmz.ui.graph.createTextItem("TV", tv);

      desk = gscene.addRect(0, 0, 400, 100);
      desk.pos(200, 300);

      newspaper = dmz.ui.graph.createRectItem(0, 0, 100, 25, desk);
      newspaper.pos(100, 50);
      dmz.ui.graph.createTextItem("Newspaper", newspaper);

      inbox = dmz.ui.graph.createRectItem(0, 0, 50, 50, desk);
      inbox.pos(10, 10);
      dmz.ui.graph.createTextItem("Inbox", inbox);

      computer = dmz.ui.graph.createRectItem(0, 0, 100, 90, desk);
      computer.pos(300, 10);
      dmz.ui.graph.createTextItem("Computer", computer);

      PageLink.Map = map;
      PageLink.Advisor0 = advisors[0];
      PageLink.Advisor1 = advisors[1];
      PageLink.Advisor2 = advisors[2];
      PageLink.Advisor3 = advisors[3];
      PageLink.Advisor4 = advisors[4];
      PageLink.Forum = computer;
      PageLink.Video = tv;
      PageLink.Newspaper = newspaper;
      PageLink.Memo = inbox;

      box = dmz.ui.webview.create();
      box.url ("http://dev.chds.us/?dystopia:map2");
      box.contextMenuPolicy (dmz.ui.consts.NoContextMenu);
      map.data(0, box);
      stackedWidget.add(box);

      widget = dmz.ui.label.create("Forum screen");
      computer.data(0, widget);
      stackedWidget.add(widget);

      widget = dmz.ui.label.create("Advisor screen");
      advisors.forEach(function (item) { item.data(0, widget); });
      stackedWidget.add(widget);

      widget = dmz.ui.label.create("Video screen");
      tv.data(0, widget);
      stackedWidget.add(widget);

      widget = dmz.ui.label.create("Newspaper screen");
      newspaper.data(0, widget);
      stackedWidget.add(widget);

      widget = dmz.ui.label.create("Memo screen");
      inbox.data(0, widget);
      stackedWidget.add(widget);

      homeButton.observe(self, "clicked", function () {

         stackedWidget.currentIndex (0);
         Object.keys(PageLink).forEach(function (key) {

            var item = PageLink[key]
              , func
              ;

            if (item) {

              func = item.data(2);
              if (func) { func(); }
            }
         });
      });

      stackedWidget.currentIndex(0);
      gscene.eventFilter(self, mouseEvent);
      dmz.ui.mainWindow.centralWidget(main);
   }
}

_exports.addPage = function (name, widget, func, onHome) {

   if (name && widget && stackedWidget && PageLink[name]) {

      stackedWidget.remove(PageLink[name].data(0));
      stackedWidget.add(widget);
      PageLink[name].data(0, widget);
      PageLink[name].data(1, func);
      PageLink[name].data(2, onHome);
   }
   else { self.log.error (name, widget, stackedWidget, PageLink[name]); }
}

setupMainWindow();

dmz.module.publish(self, _exports);
