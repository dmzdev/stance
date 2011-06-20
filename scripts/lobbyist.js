var dmz =
   { ui:
      { loader: require('dmz/ui/uiLoader')
      , graph: require("dmz/ui/graph")
      }
   , stance: require("stanceConst")
   , object: require("dmz/components/object")
   , module: require("dmz/runtime/module")
   , resources: require("dmz/runtime/resources")
   }

   // UI Elements
   , lobbyistForm = dmz.ui.loader.load("LobbyistWindow.ui")
   , bioText = lobbyistForm.lookup("bioText")
   , messageText = lobbyistForm.lookup("messageText")
   , nameLabel = lobbyistForm.lookup("nameLabel")
   , specialtyLabel = lobbyistForm.lookup("specialtyLabel")
   , pictureLabel = lobbyistForm.lookup("pictureLabel")

   // Variables
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   ;

dmz.module.subscribe(self, "main", function (Mode, module) {

   var idx
     , list
     ;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage ("Lobbyist", lobbyistForm, function () {

         var hil = dmz.object.hil()
           , hilGroup = dmz.stance.getUserGroupHandle(hil)
           , lobHandle = dmz.object.subLinks(hilGroup, dmz.stance.ActiveLobbyistHandle)
           , pic = false
           ;

         if (lobHandle) {

            lobHandle = lobHandle[0];
            bioText.text(dmz.object.text(lobHandle, dmz.stance.BioHandle));
            messageText.text(dmz.object.text(lobHandle, dmz.stance.TextHandle));
            nameLabel.text(dmz.object.text(lobHandle, dmz.stance.NameHandle));
            specialtyLabel.text(dmz.object.text(lobHandle, dmz.stance.TitleHandle));
            pic =
               dmz.ui.graph.createPixmap(
                  dmz.resources.findFile(dmz.object.text(lobHandle, dmz.stance.PictureHandle)));
            if (pic) { pictureLabel.pixmap(pic); }
            if (!dmz.object.linkHandle(dmz.stance.ViewedLobbyistHandle, lobHandle, hil)) {

               dmz.object.link(dmz.stance.ViewedLobbyistHandle, lobHandle, hil);
            }
         }
         else {

            bioText.text("");
            messageText.text("");
            nameLabel.text("");
            specialtyLabel.text("");
            pictureLabel.clear();
         }
      });
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

dmz.object.link.observe(self, dmz.stance.ActiveLobbyistHandle,
function (objHandle, attrHandle, groupHandle, lobbyistHandle) {

   if (dmz.stance.getUserGroupHandle(dmz.object.hil()) === groupHandle) {

      MainModule.highlight("Lobbyist");
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   var lobbyist = false;
   if (value) {

      lobbyist =
         dmz.object.subLinks(
            dmz.stance.getUserGroupHandle(objHandle), dmz.stance.ActiveLobbyistHandle);
      if (lobbyist && lobbyist[0] &&
         !dmz.object.linkHandle(dmz.stance.ViewedLobbyistHandle, lobbyist[0], objHandle)) {

         MainModule.highlight("Lobbyist");
      }
   }
});
