require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require("dmz/ui/consts")
      , layout: require("dmz/ui/layout")
      , loader: require("dmz/ui/uiLoader")
      , mainWindow: require("dmz/ui/mainWindow")
      , messageBox: require("dmz/ui/messageBox")
      , stackedWidget: require("dmz/ui/stackedWidget")
      , graph: require("dmz/ui/graph")
      , widget: require("dmz/ui/widget")
      , event: require("dmz/ui/event")
      , label: require("dmz/ui/label")
      , webview: require("dmz/ui/webView")
      }
   , config: require("dmz/runtime/config")
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
//   , groupBox = main.lookup("groupBox")
   , stackedWidget = main.lookup("stackedWidget")
   , achievementDialog
   , achievementPic
   , achievementText
   , mainGView = main.lookup("graphicsView")
   , gscene
   , lastDialogWidget

   // Consts
   , NAME_INDEX = 0
   , HOME_INDEX = 0
   , SPLASH_INDEX = 1

   // Variables
   , lastItem

   , CurrentGameHandle = false
   , VideoHomeMessage = dmz.message.create("VideoHome")
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , ToggledGroupMessage = dmz.message.create("ToggledGroupMessage")
   , HaveToggled = false
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
   , ItemPage = {}
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
        , Help: false
        , Bookcase: false
        , Resource: false
        , Rolodex: false
        }
   , LoggedIn = false
   , hil
   , loggedInId = false
   , showAchievementDialog = false
   , groupAdvisors = {}
   , advisorPicture = {}
   , LastGViewSize = false
   , AchievementQueue = []
   , DefaultAchievement = "Logged_In_Image"
   , dialogOpen = false
   , EmailMod =
        { list: []
        , sendMail: function (a, b, c) { this.list.push([a, b, c]); }
        , techList: []
        , sendTechEmail: function (a, b) { this.techList.push([a,b]); }
        }

   // Messages
   , LoginSuccessMessage = dmz.message.create("Login_Success_Message")
   , LoginFailedMessage = dmz.message.create("Login_Failed_Message")

   // Function decls
   , setupMainWindow
   , mouseEvent
   , updateGraphicsForGroup
   , setPixmapFromResource
   , setGItemPos
   , getConfigFont
   , displayNewAchievements

   // API
   , _exports = {}
   ;

self.shutdown = function () {

   if (mainGView) { mainGView.removeEventFilter(); }
   if (gscene) { gscene.removeEventFilter(); }
};

VideoHomeMessage.subscribe(self, function () {

   if (stackedWidget) { stackedWidget.currentIndex(HOME_INDEX); }
});

setGItemPos = function (item, vector) {

   if (item && dmz.vector.isTypeOf(vector)) { item.pos(vector.x, vector.y); }
};

getConfigFont = function (config) {

   var result = false
     , font
     ;

   if (config && dmz.config.isTypeOf(config)) {

      font = config.get("font");
      font = (font && font.length) ? font[0] : false;
      if (font) {

         result =
            { font: font.string("name", "Times")
            , size: font.number("size", 25)
            , weight: font.number("weight", 75)
            };
      }
      else { result = { font: "Times", size: 25, weight: 75 }; }
   }
   return result;
};

setPixmapFromResource = function (graphicsItem, resourceName) {

   var file = dmz.resources.findFile(resourceName)
     , config = dmz.resources.lookupConfig(resourceName)
     , name
     , loc
     , pixmap
     , font
     , highlight
     ;

   if (graphicsItem && config && file) {

      loc = config.vector("loc");
      pixmap = dmz.ui.graph.createPixmap(file);
      if (pixmap) { graphicsItem.pixmap(pixmap); }
      if (dmz.vector.isTypeOf(loc)) { graphicsItem.pos(loc.x, loc.y); }
      loc = config.vector("offset");
      if (dmz.vector.isTypeOf(loc)) {

         name = graphicsItem.data(NAME_INDEX);
         if (PageLink[name] && PageLink[name].highlight) {

            PageLink[name].highlight.pos(loc.x, loc.y);
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
               PageLink[advisorKey[index]].pixmap,
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
         case "Vote": attr = dmz.stance.VoteImageHandle; break;
         case "Help": attr = dmz.stance.HelpImageHandle; break;
         case "Bookcase": attr = dmz.stance.BookcaseImageHandle; break;
         case "Resource": attr = dmz.stance.ResourceImageHandle; break;
         case "Rolodex": attr = dmz.stance.RolodexImageHandle; break;
         default: self.log.warn ("Key ("+key+") has no associated handle."); break;
         }
         if (attr) {

            setPixmapFromResource(PageLink[key].pixmap, dmz.object.text(groupHandle, attr));
         }
      });

      if (LoggedIn) { stackedWidget.currentIndex(HOME_INDEX); }
   }
};

mouseEvent = function (object, event) {

   var type = event.type()
     , pos
     , items
     ;

   if (object == gscene) {

      if (type == dmz.ui.event.GraphicsSceneMousePress) {

         pos = event.scenePos();
         items =
            object.items(pos, dmz.ui.consts.IntersectsItemShape, dmz.ui.consts.DescendingOrder);
         items.forEach(function (item) {

            var name = item.data(NAME_INDEX)
              , data = PageLink[name]
              ;
            if (data) {

               if (data.dialog) {

                  dmz.time.setTimer(self, function () {

                     var rect = main.rect()
                       , geo = dmz.ui.mainWindow.window().geometry()
                       , pos = main.pos()
                       ;
                     if (data.onClicked && rect.width && rect.height) {

                        data.onClicked(rect.width, rect.height);
                     }
                     if (rect.width && rect.height) {

                        data.dialog.fixedSize(rect.width * 0.95, rect.height * 0.95);
                        if (dmz.defs.OperatingSystem === dmz.defs.Win32) {

                           data.dialog.move
                              ( geo.x + ((geo.width - (rect.width * 0.95)) / 2)
                              , geo.y + pos[1]
                              );
                        }
                     }

                     dialogOpen = true;
                     data.dialog.open(self, function (value) {

                        if (data.highlight) { data.highlight.hide(); }
                        if (data.onHome) { data.onHome(value); }
                        dialogOpen = false;
                        if (AchievementQueue.length) { displayNewAchievements(); }
                     });
                  });
               }
               else if (data.widget && stackedWidget) {

                  stackedWidget.currentWidget(data.widget);
                  if (data.onClicked) { data.onClicked(); }
                  if (data.highlight) { data.highlight.hide(); }
               }
            }
         });
      }
   }
   return false;
};

dmz.object.link.observe(self, dmz.stance.GameGroupHandle,
function (objHandle, attrHandle, groupHandle, gameHandle) {

   GroupList.push(groupHandle);
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      if (loggedInId) {

         showAchievementDialog = true;
         if (hil !== objHandle) { AchievementQueue = []; }
      }
      hil = objHandle;
      if (!dmz.stance.isAllowed(objHandle, dmz.stance.SwitchGroupFlag) || HaveToggled) {

         updateGraphicsForGroup(dmz.stance.getUserGroupHandle(objHandle));
      }

      Object.keys(PageLink).forEach(function (item) {

         if (PageLink[item].highlight) { PageLink[item].highlight.hide(); }
      });
      displayNewAchievements();
   }
});

dmz.object.unlink.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, userHandle, groupHandle) {

   if (userHandle === dmz.object.hil()) {

      Object.keys(PageLink).forEach(function (item) {

         if (PageLink[item].highlight) { PageLink[item].highlight.hide(); }
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

      widget = dmz.ui.mainWindow.statusBar();
      if (widget) { widget.hide(); }

      file = dmz.resources.findFile(self.config.string("splash.name"));
      if (file) { main.lookup("splashLabel").pixmap(dmz.ui.graph.createPixmap(file)); }
      stackedWidget.currentIndex(SPLASH_INDEX);

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
           , font
           , offset
           , pixmap
           , widget
           , prev
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
                     PageLink[name] = { pixmap: pixmap };
                     pixmap.data(NAME_INDEX, name);
                     if (highlight) {

                        pixmap = dmz.ui.graph.createPixmap(highlight);
                        pixmap = dmz.ui.graph.createPixmapItem(pixmap, PageLink[name].pixmap);
                        PageLink[name].highlight = pixmap;
                        offset = config.vector("offset");
                        if (dmz.vector.isTypeOf(offset)) { pixmap.pos(offset.x, offset.y); }
                        pixmap.hide();
                     }
                  }
               }
            }
         }
      });

      _exports.addPage
         ( "Exit"
         , dmz.ui.messageBox.create(
              { type: dmz.ui.messageBox.Warning
              , text: "Are you sure you wish to exit?"
              , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
              , defaultButton: dmz.ui.messageBox.Cancel
              }
              , main
              )
         , undefined
         , function (value) { if (value === dmz.ui.messageBox.Ok) { dmz.sys.requestExit(); } }
         );

      gscene.eventFilter(self, mouseEvent);
      dmz.ui.mainWindow.centralWidget(main);
      achievementDialog = dmz.ui.loader.load("AchievementDialog.ui", dmz.ui.mainWindow.centralWidget())
      achievementPic = achievementDialog.lookup("pictureLabel")
      achievementText = achievementDialog.lookup("textLabel")
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

   var dialog;

   if (name && PageLink[name] && widget) {

      if (PageLink[widget] && PageLink[widget].dialog) {

         PageLink[name].dialog = PageLink[widget].dialog;
      }
      else if (widget.inherits("QDialog")) { PageLink[name].dialog = widget; }
      else {

         dialog = dmz.ui.loader.load("WindowDialog.ui", dmz.ui.mainWindow.centralWidget());
         dialog.opacity(1);
         if (dmz.defs.OperatingSystem === dmz.defs.Win32) { dialog.setWindowsHint(); }
         dialog.lookup("scrollArea").widget(widget);
         PageLink[name].dialog = dialog;
      }
      PageLink[name].onClicked = func;
      PageLink[name].onHome = onHome;
      PageLink[name].pixmap.cursor(dmz.ui.consts.PointingHandCursor);
      PageLink[name].widget = widget;
   }
};

_exports.highlight = function (name) {

   var highlight;
   if (name && PageLink[name]) {

      highlight = PageLink[name].highlight;
      if (highlight) { highlight.show();}
   }
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.GameType)) { CurrentGameHandle = objHandle; }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var messageBox;

   if ((objHandle === CurrentGameHandle) && !newVal && oldVal &&
      (dmz.object.scalar(dmz.object.hil(), dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION)) {

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Warning
         , text: "Your permissions have been changed remotely, please restart the game."
         , standardButtons: [dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Ok
         }
         , dmz.ui.mainWindow.centralWidget()
         ).open (self, function (value, dialog) {

            if (value === dmz.ui.messageBox.Ok) { dmz.sys.requestExit(); }
         });
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkObjHandle, attrHandle, advisorHandle, groupHandle) {

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

dmz.object.state.observe(self, dmz.stance.Permissions, function (handle, attrHandle, value, prev) {

   if ((handle === dmz.object.hil()) && stackedWidget && prev &&
      value.xor(prev).and(dmz.stance.SwitchGroupFlag).bool()) {

      stackedWidget.currentIndex(SPLASH_INDEX);
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (objHandle, attrHandle, userHandle, groupHandle) {

   if ((userHandle === dmz.object.hil()) &&
      (!dmz.stance.isAllowed(userHandle, dmz.stance.SwitchGroupFlag) || HaveToggled)) {

      updateGraphicsForGroup(groupHandle);
   }
});

(function () {

   var list = self.config.get("help-list.email")
     , helpEmailList = []
     ;

   if (list) {

      list.forEach(function (emailConfig) {

         var addr = emailConfig.string("address");
         if (addr) { helpEmailList.push(addr); }
      });
   }

   setupMainWindow();
   if (!self.config.number("login.value", 0)) {

      dmz.time.setTimer(self, 3, function () {

         if (!LoggedIn && stackedWidget) {

            stackedWidget.currentIndex(HOME_INDEX);
            LoggedIn = true;
         }
      });
   }
}());

LoginSuccessMessage.subscribe(self, function (data) {

   self.log.warn("Login Success, logged in");
   loggedInId = data.string(dmz.stance.NameHandle);
   LoggedIn = true;
});

LoginFailedMessage.subscribe(self, function (data) {

   self.log.warn("Couldn't connect to the server, logged in");
   showAchievementDialog = true;
   LoggedIn = true;
});

LoginSkippedMessage.subscribe(self, function (data) {

   self.log.warn("Login skipped, logged in");
   showAchievementDialog = true;
   LoggedIn = true;
   LoginSkipped = true;
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      if (EmailMod.list && EmailMod.list.length) {

         EmailMod.list.forEach(function (email) {

            module.sendMail(email[0], email[1], email[2]);
         });
      }
      if (EmailMod.techList && EmailMod.techList.length) {

         EmailMod.techList.forEach(function (email) {

            module.sendTechMail(email[0], email[1]);
         });
      }

      EmailMod = module;
   }
});

ToggledGroupMessage.subscribe(self, function (data) { HaveToggled = true; });

displayNewAchievements = function () {

   var obj
     , file
     ;
   if (AchievementQueue.length && !dialogOpen && showAchievementDialog) {

      obj = AchievementQueue.pop();
      achievementText.text("You have unlocked the " + obj.name + " achievement.");
      file = dmz.resources.findFile(obj.image) || dmz.resources.findFile(DefaultAchievement);
      achievementPic.pixmap(dmz.ui.graph.createPixmap(file).scaled(100, 100));
      dialogOpen = true;
      achievementDialog.open(self, function () {

         dialogOpen = false;
         displayNewAchievements();
      });
   }
};

dmz.stance.ACHIEVEMENT_MESSAGE.subscribe(self, function (data) {

   var obj;
   if (data) {

      AchievementQueue.push(
         { image: data.string(dmz.stance.PictureHandle, 0) || DefaultAchievement
         , name: data.string(dmz.stance.NameHandle, 0) || "N/A"
         });

      if (!dialogOpen) { displayNewAchievements(); }
   }
});

dmz.module.publish(self, _exports);
