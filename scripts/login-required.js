var dmz =
       { data: require("dmz/runtime/data")
       , message: require("dmz/runtime/messaging")
       , defs: require("dmz/runtime/definitions")
       }
    // Handles
    , TargetHandle = dmz.defs.createNamedHandle("dmzQtPluginLoginDialog")
    // Constants
    , LoginRequiredMsg = dmz.message.create("LoginRequiredMessage")

    ;

(function () {
   LoginRequiredMsg.send (TargetHandle);
}());
