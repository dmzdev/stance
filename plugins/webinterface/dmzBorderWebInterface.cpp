#include "dmzBorderWebInterface.h"
#include <dmzQtModuleMainWindow.h>
#include <dmzRuntimeConfigToNamedHandle.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeData.h>
#include <dmzRuntimeDefinitions.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimePluginInfo.h>
#include <dmzTypesVector.h>
#include <QtGui/QMainWindow>
#include <QtWebKit/QWebView>
#include <QtWebKit/QWebFrame>

dmz::BorderWebInterface::BorderWebInterface (const PluginInfo &Info, Config &local) :
      QObject (0),
      Plugin (Info),
      MessageObserver (Info),
      _log (Info),
      _pinPositionHandle (0),
      _pinTitleHandle (0),
      _pinDescHandle (0),
      _pinObjectHandle (0),
      _screenCoordHandle (0),
      _mainWindow (0),
      _haveSetJSObject (false) {

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

      if (_haveSetJSObject) { _addPin (InData); }
      else { _pinDataQueue.append (InData); }
   }
   else if (Type == _removePinMessage) {

      int handle = -1;
      if (InData->lookup_int32 (_pinObjectHandle, 0, handle)) {

         if (!_removePinList.contains (handle)) {

            _addPinList.removeAll (handle);
            emit (removePin (handle));
         }
      }
   }
   else if (Type == _movePinMessage) {

      int handle;
      Float64 x = -1, y = -1;

      if (InData->lookup_int32 (_pinObjectHandle, 0, handle) &&
         InData->lookup_float64 (_pinPositionHandle, 0, x) &&
         InData->lookup_float64 (_pinPositionHandle, 1, y)) {

         if (!_movePinList.contains (handle)) {

            _movePinList.append (handle);
            emit (movePin (handle, x, y));
         }
      }
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
         _haveSetJSObject = true;
         while (_pinDataQueue.length ()) {

            const Data *data = _pinDataQueue.takeFirst ();
            if (data) { _addPin (data); }
         }
      }
   }
}


// BorderWebInterface Interface
void
dmz::BorderWebInterface::pinWasAdded (const int handle, const float worldX, const float worldY) {

   Data data;
   data.store_int32 (_pinObjectHandle, 0, handle);
   Vector vec (worldX, worldY, 0);
   data.store_vector (_pinPositionHandle, 0, vec);
   _pinAddedMessage.send (&data);
}


void
dmz::BorderWebInterface::pinWasMoved (const int handle, const float worldX, const float worldY) {

   Data data;
   Vector vec (worldX, worldY, 0);
   data.store_vector (_pinPositionHandle, 0, vec);
   data.store_int32 (_pinObjectHandle, 0, handle);
   _movePinList.removeAll (handle);
   _pinMovedMessage.send (&data);
}


void
dmz::BorderWebInterface::pinWasRemoved (const int handle) {

   Data data;
   data.store_int32 (_pinObjectHandle, 0, handle);
   _removePinList.removeAll (handle);
   _pinRemovedMessage.send (&data);
}


void
dmz::BorderWebInterface::pinSelected (const int handle) {

   Data data;
   data.store_int32 (_pinObjectHandle, 0, handle);
   _pinSelectedMessage.send (&data);
}


void
dmz::BorderWebInterface::_addPin (const Data *InData) {

   Vector vec;
   int handle;
   String title, description, filename;
   Boolean isScreen;

   if (InData->lookup_string (_pinTitleHandle, 0, title) &&
      InData->lookup_string (_pinDescHandle, 0, description) &&
      InData->lookup_string (_pinFileHandle, 0, filename) &&
      InData->lookup_vector (_pinPositionHandle, 0, vec) &&
      InData->lookup_int32 (_pinObjectHandle, 0, handle) &&
      InData->lookup_boolean (_screenCoordHandle, 0, isScreen)) {

      emit (
         addPin (
            handle,
            vec.get_x (),
            vec.get_y (),
            isScreen,
            title.get_buffer (),
            description.get_buffer (),
            filename.get_buffer ()));
   }
}


void
dmz::BorderWebInterface::_init (Config &local) {

   RuntimeContext *context = get_plugin_runtime_context ();

   _uiV8Name = config_to_string ("module.js.name", local, "dmzJsModuleUiV8QtBasic");
   _jsWindowObjectName = config_to_string ("module.js.windowObject.name", local, "dmz");
   _mainWindowName = config_to_string ("module.main-window.name", local, "dmzQtModuleMainWindowBasic");
   _webviewName = config_to_string ("webview.name", local, "WebView");

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

   _pinFileHandle = config_to_named_handle (
      "pin-handles.file.name",
      local,
      "pinFileHandle",
      context);

   _pinObjectHandle = config_to_named_handle (
      "pin-handles.object-handle.name",
      local,
      "pinObjectHandle",
      context);

   _screenCoordHandle = config_to_named_handle (
      "pin-handles.screen-coord.name",
      local,
      "is_screen_coord",
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

   _movePinMessage = config_create_message (
      "message-names.move",
      local,
      "MovePinMessage",
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

   _pinSelectedMessage = config_create_message (
      "message-names.selected",
      local,
      "PinSelectedMessage",
      context,
      &_log);

   subscribe_to_message (_setWebViewMessage);
   subscribe_to_message (_addPinMessage);
   subscribe_to_message (_removePinMessage);
   subscribe_to_message (_movePinMessage);
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
