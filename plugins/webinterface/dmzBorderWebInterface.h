#ifndef DMZ_BORDER_WEB_INTERFACE_DOT_H
#define DMZ_BORDER_WEB_INTERFACE_DOT_H

#include <dmzRuntimeLog.h>
#include <dmzRuntimeMessaging.h>
#include <dmzRuntimePlugin.h>
#include <QtCore/QObject>
#include <QtCore/QMap>
#include <QtCore/QVariant>

namespace dmz {

   class QtModuleMainWindow;
   class Data;

   class BorderWebInterface :
         public QObject,
         public Plugin,
         public MessageObserver{

      Q_OBJECT

      public:
         BorderWebInterface (const PluginInfo &Info, Config &local);
         ~BorderWebInterface ();

         // Plugin Interface
         virtual void update_plugin_state (
            const PluginStateEnum State,
            const UInt32 Level);

         virtual void discover_plugin (
            const PluginDiscoverEnum Mode,
            const Plugin *PluginPtr);

         // Message Observer Interface
         virtual void receive_message (
            const Message &Type,
            const UInt32 MessageSendHandle,
            const Handle TargetObserverHandle,
            const Data *InData,
            Data *outData);

      signals:
         void addPin (const float x, const float y, const QString title, const QString description, const QString filename, int objectHandle, QVariantList groupHandles);
         void removePin (const int id);

      public slots:
         void pinWasMoved (const int id, const float worldX, const float worldY);
         void pinWasAdded (const int id, const float worldX, const float worldY, const QString title, const QString description, const QString filename, int objectHandle, QVariantList groupHandles);
         void pinWasRemoved (const int id);
         void pinSelected (const int id);

      protected:
         // BorderWebInterface Interface
         void _addPin (const Data *InData);
         void _init (Config &local);

         Log _log;

         Message _addPinMessage;
         Message _pinAddedMessage;
         Message _pinMovedMessage;
         Message _pinRemovedMessage;
         Message _pinSelectedMessage;
         Message _removePinMessage;
         Message _setWebViewMessage;

         Handle _pinIDHandle;
         Handle _pinPositionHandle;
         Handle _pinTitleHandle;
         Handle _pinDescHandle;
         Handle _pinFileHandle;
         Handle _pinObjectHandle;
         Handle _groupPinHandle;
         Handle _pinGroupCountHandle;

         String _uiV8Name;
         String _jsWindowObjectName;
         String _mainWindowName;
         QtModuleMainWindow *_mainWindow;

         String _webviewName;

         Boolean _haveSetJSObject;
         QList<const Data *> _pinDataQueue;

      private:
         BorderWebInterface ();
         BorderWebInterface (const BorderWebInterface &);
         BorderWebInterface &operator= (const BorderWebInterface &);

   };
};

#endif // DMZ_BORDER_WEB_INTERFACE_DOT_H
