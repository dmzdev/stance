#include "dmzBorderWebInterface.h"
#include <dmzQtModuleMainWindow.h>
#include <dmzRuntimeConfigToNamedHandle.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeData.h>
#include <dmzRuntimeDefinitions.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimePluginInfo.h>
#include <QtGui/QMainWindow>
#include <QtWebKit/QWebView>
#include <QtWebKit/QWebFrame>

dmz::BorderWebInterface::BorderWebInterface (const PluginInfo &Info, Config &local) :
      QObject (0),
      Plugin (Info),
      MessageObserver (Info),
      _log (Info),
      _pinIDHandle (0),
      _pinPositionHandle (0),
      _pinTitleHandle (0),
      _pinDescHandle (0),
      _mainWindow (0) {

   _init (local);
}


dmz::BorderWebInterface::~BorderWebInterface () {;}


// Plugin Interface
void
dmz::BorderWebInterface::update_plugin_state (
      const PluginStateEnum State,
      const UInt32 Level) {

   if (State == PluginStateInit) {

   }
   else if (State == PluginStateStart) {

   }
   else if (State == PluginStateStop) {

   }
   else if (State == PluginStateShutdown) {

   }
}


void
dmz::BorderWebInterface::discover_plugin (
      const PluginDiscoverEnum Mode,
      const Plugin *PluginPtr) {

   if (Mode == PluginDiscoverAdd) {

      if (!_mainWindow) {

         _mainWindow = QtModuleMainWindow::cast (PluginPtr, _mainWindowName);
      }
   }
   else if (Mode == PluginDiscoverRemove) {

   }
}


// Message Observer Interface
void
dmz::BorderWebInterface::receive_message (
      const Message &Type,
      const UInt32 MessageSendHandle,
      const Handle TargetObserverHandle,
      const Data *InData,
      Data *outData) {

   if (Type == _addPinMessage) {

      int x = -1, y = -1;
      String title, description;


      if (InData->lookup_int32 (_pinPositionHandle, 0, x) &&
         InData->lookup_int32 (_pinPositionHandle, 1, y) &&
         InData->lookup_string (_pinTitleHandle, 0, title) &&
         InData->lookup_string (_pinDescHandle, 0, description)) {

         emit (addPin (x, y, title.get_buffer (), description.get_buffer ()));
      }

      _log.warn << "X: " << x << " Y: " << y << " title: " << title << " desc: " << description << endl;
   }
   else if (Type == _removePinMessage) {

      int id;
      if (InData->lookup_int32 (_pinIDHandle, 0, id)) { emit (removePin (id)); }
   }
   else if (Type == _setWebViewMessage) {

      QWebView *webview (0);
      if (_mainWindow) {

         webview = _mainWindow->get_qt_main_window ()->findChild<QWebView *>(_webviewName.get_buffer ());
      }

      if (webview) {

         webview->page ()->mainFrame ()->addToJavaScriptWindowObject (
            _jsWindowObjectName.get_buffer (),
            this);
      }
      _log.warn << "setwebview: " << _mainWindow << " " << webview << " " << _webviewName << " " << _jsWindowObjectName << endl;
   }
}


// BorderWebInterface Interface
void
dmz::BorderWebInterface::pinWasAdded (
      const int id,
      const int x,
      const int y,
      const QString title,
      const QString description) {

   Data data;
   data.store_int32 (_pinIDHandle, 0, id);
   data.store_int32 (_pinPositionHandle, 0, x);
   data.store_int32 (_pinPositionHandle, 1, y);
   data.store_string (_pinTitleHandle, 0, qPrintable (title));
   data.store_string (_pinDescHandle, 0, qPrintable (description));
   _pinAddedMessage.send (&data);
}


void
dmz::BorderWebInterface::pinWasMoved (const int id, const int x, const int y) {

   Data data;
   data.store_int32 (_pinIDHandle, 0, id);
   data.store_int32 (_pinPositionHandle, 0, x);
   data.store_int32 (_pinPositionHandle, 1, y);
   _log.warn << "Sending: " << _pinMovedMessage.get_name () << endl;
   _pinMovedMessage.send (&data);
}


void
dmz::BorderWebInterface::pinWasRemoved (const int id) {

   Data data;
   data.store_int32 (_pinIDHandle, 0, id);
   _pinRemovedMessage.send (&data);
}


void
dmz::BorderWebInterface::_init (Config &local) {

   RuntimeContext *context = get_plugin_runtime_context ();

   _uiV8Name = config_to_string ("module.js.name", local, "dmzJsModuleUiV8QtBasic");
   _jsWindowObjectName = config_to_string ("module.js.windowObject.name", local, "dmz");
   _mainWindowName = config_to_string ("module.main-window.name", local, "dmzQtModuleMainWindowBasic");
   _webviewName = config_to_string ("webview.name", local, "WebView");

   _pinIDHandle = config_to_named_handle (
      "pin-handles.id.name",
      local,
      "pinID",
      context);
   _pinPositionHandle = config_to_named_handle (
      "pin-handles.position.name",
      local,
      "pinPosition",
      context);
   _pinTitleHandle = config_to_named_handle (
      "pin-handles.title.name",
      local,
      "pinTitle",
      context);
   _pinDescHandle = config_to_named_handle (
      "pin-handles.description.name",
      local,
      "pinDescription",
      context);

   _addPinMessage = config_create_message (
      "message-names.add",
      local,
      "AddPinMessage",
      context,
      &_log);

   _pinAddedMessage = config_create_message (
      "message-names.add-confirm",
      local,
      "PinAddedMessage",
      context,
      &_log);

   _removePinMessage = config_create_message (
      "message-names.remove",
      local,
      "RemovePinMessage",
      context,
      &_log);

   _pinRemovedMessage = config_create_message (
      "message-names.remove-confirm",
      local,
      "PinRemovedMessage",
      context,
      &_log);

   _pinMovedMessage = config_create_message (
      "message-names.moved",
      local,
      "PinMovedMessage",
      context,
      &_log);

   _setWebViewMessage = config_create_message (
      "message-names.set-interface",
      local,
      "SetInterfaceWebViewMessage",
      context,
      &_log);

   subscribe_to_message (_setWebViewMessage);
   subscribe_to_message (_addPinMessage);
   subscribe_to_message (_removePinMessage);
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL dmz::Plugin *
create_dmzBorderWebInterface (
      const dmz::PluginInfo &Info,
      dmz::Config &local,
      dmz::Config &global) {

   return new dmz::BorderWebInterface (Info, local);
}

};
