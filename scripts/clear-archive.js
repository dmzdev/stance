var dmz =
   { ui:
      { mainWindow: require("dmz/ui/mainWindow")
      , messageBox: require("dmz/ui/messageBox")
      }
   , message: require("dmz/runtime/messaging")
   , sys: require("sys")
   }
   , ClearArchiveMessage = dmz.message.create(self.config.string("clear-archive.message"))
   ;


dmz.ui.mainWindow.addMenu(self, "&File", "Clear Cache", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Question
      , text: "Are you sure you wish to clear your local STANCE data cache?"
      , informativeText: "This will immediately exit STANCE. Data will be re-downloaded upon launching the game."
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , dmz.ui.mainWindow.centralWidget()
      ).open(self, function (value, dialog) {

         if (value === dmz.ui.messageBox.Ok) {

            if (ClearArchiveMessage) {

               ClearArchiveMessage.send();
               dmz.sys.requestExit();
            }
         }
      });
});
