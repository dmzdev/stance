#include "stanceInit.h"
#include <dmzApplication.h>
#include <dmzAppShellExt.h>
#include <dmzFoundationCommandLine.h>
#include <dmzFoundationJSONUtil.h>
#include <dmzFoundationXMLUtil.h>
#include <dmzQtConfigRead.h>
#include <dmzQtConfigWrite.h>
#include <dmzRuntimeConfig.h>
#include <dmzRuntimeConfigToTypesBase.h>
#include <dmzRuntimeConfigWrite.h>
#include <dmzRuntimePluginFactoryLinkSymbol.h>
#include <dmzRuntimeSession.h>
#include <dmzRuntimeVersion.h>
#include <dmzTypesHashTableStringTemplate.h>

#include <QtCore/QUrl>
#include <QtCore/QDateTime>
#include <QtGui/QCloseEvent>
#include <QtGui/QDesktopServices>
#include <QtGui/QDesktopWidget>
#include <QtGui/QLabel>
#include <QtNetwork/QNetworkAccessManager>
#include <QtNetwork/QNetworkReply>
#include <QtNetwork/QNetworkRequest>
#include <QtNetwork/QNetworkCookie>


using namespace dmz;

namespace {

static const String StanceName ("stance");
static const String StanceInitName ("stanceInit");
static const String GeometryName ("geometry");
static const QByteArray StanceKey ("f2e6318c823ad03fa2eb395642000de7");
static const QString DateFormat ("ddd, dd MMM yyyy HH:mm:ss 'G''M''T'");


QByteArray
local_calc_xor (const QByteArray &Data, const QByteArray &Key) {

   QByteArray result;

   if (Key.isEmpty ()) { result = Data; }
   else {

      for (int ix = 0 , jx = 0; ix < Data.length (); ++ix , ++jx) {

         if (jx == Key.length ()) { jx = 0; }
         result.append (Data.at (ix) ^ Key.at (jx));
      }
   }

    return result;
}


static void
local_restore_session (AppShellInitStruct &appInit, StanceInit &stanceInit) {

   Config session = get_session_config (StanceInitName, appInit.app.get_context ());

   if (config_to_boolean ("remember.me", session)) {

      stanceInit.ui.rememberMe->setChecked (True);

      String username = config_to_string ("user.name", session);
      stanceInit.ui.usernameLineEdit->setText (username.get_buffer ());

      QByteArray ba (config_to_qbytearray ("password", session));
      QByteArray password = local_calc_xor (ba, StanceKey.toBase64 ());

      stanceInit.ui.passwordLineEdit->setText (password);
   }

   Config geometry;
   if (session.lookup_config (GeometryName, geometry)) {

      stanceInit.restoreGeometry (config_to_qbytearray (geometry));
   }
   else {

      QRect rect = QApplication::desktop ()->availableGeometry (&stanceInit);
      stanceInit.move(rect.center () - stanceInit.rect ().center ());
   }
}


static void
local_add_config (const String &Scope, AppShellInitStruct &init) {

   Config configList;

   if (init.manifest.lookup_all_config (Scope, configList)) {

      ConfigIterator it;
      Config config;

      while (configList.get_next_config (it, config)) {

         const String Value = config_to_string ("file", config);

         if (Value) { init.files.append_arg (Value); }
      }
   }
}

};

StanceInit::StanceInit (AppShellInitStruct &theInit) :
      init (theInit),
      _netManager (0),
      _frameTime (0),
      _start (False) {

   setObjectName (StanceInitName.get_buffer ());

   _netManager = new QNetworkAccessManager (this);

   ui.setupUi (this);
}


StanceInit::~StanceInit () {

   if (_netManager) {

      _netManager->deleteLater ();
//      delete _netManager;
      _netManager = 0;
   }
}


QString
StanceInit::user () { return ui.usernameLineEdit->text (); }


QString
StanceInit::password () { return ui.passwordLineEdit->text (); }


void
StanceInit::on_buttonBox_accepted () {

   if (user ().isEmpty () || password ().isEmpty ()) {

      ui.infoLabel->setText ("User name and password required.");
   }
   else {

      _fetch_session ();
      ui.infoLabel->setText ("Login in...");

//      _start = True;
//      close ();
   }

}


void
StanceInit::on_buttonBox_rejected () {

   close ();
}


void
StanceInit::_fetch_session () {

   if (_netManager) {

      if (!user ().isEmpty () && !password ().isEmpty ()) {

         QString server = "http://localhost:5984/_session";
         QUrl url (server);

         QUrl params;
         params.addQueryItem ("name", user ());
         params.addQueryItem ("password", password ());

         QNetworkRequest request (url);

         request.setHeader (
            QNetworkRequest::ContentTypeHeader,
            "application/x-www-form-urlencoded");

         init.app.log.info << "Post: " << qPrintable (url.toString ()) << endl;

         QNetworkReply *reply (_netManager->post (request, params.encodedQuery ()));
         if (reply) {

            connect (reply, SIGNAL (finished ()), this, SLOT (_handle_fetch_session ()));
         }
      }
   }
}


void
StanceInit::_handle_fetch_session () {

   QNetworkReply *reply (qobject_cast<QNetworkReply *>(sender ()));
   if (reply) {

      Int32 statusCode =
         reply->attribute (QNetworkRequest::HttpStatusCodeAttribute).toInt();

      _frameTime = QDateTime::currentDateTime ().toTime_t ();

      if (reply->hasRawHeader ("Date")) {

         // Sat, 26 Feb 2011 06:53:43 GMT
         QString rawDate (reply->rawHeader ("Date"));
         QDateTime dateTime = QDateTime::fromString (rawDate, DateFormat);
         if (dateTime.isValid ()) { _frameTime = dateTime.toTime_t (); }
      }

      if (reply->error () == QNetworkReply::NoError) {

         QByteArray data (reply->readAll ());
         const String JsonData (data.constData ());

         ui.infoLabel->setText (data);

         if (JsonData) {

            Config global ("global");
            if (json_string_to_config (JsonData, global)) {

               if (config_to_boolean ("ok", global)) {

                  QVariant var = reply->header(QNetworkRequest::SetCookieHeader);
                  QList<QNetworkCookie> cookies = qvariant_cast<QList<QNetworkCookie> >(var);

                  if (cookies.count() != 0){

                     QNetworkCookie cookie = cookies.first ();
                     _cookieValue = cookie.value ().constData ();
                  }

                  init.app.log.error << "cookie: " << _cookieValue << endl;

                  _authenticatedAs = config_to_string ("name", global);

                  Config roles;
                  if (!_authenticatedAs && global.lookup_all_config ("roles", roles)) {

                     ConfigIterator it;
                     Config cd;

                     while (!_authenticatedAs && roles.get_next_config (it, cd)) {

                        String role = config_to_string ("value", cd);
                        if (role == "_admin") { _authenticatedAs = "admin"; }
                     }
                  }

                  _start = True;
                  close ();
               }
            }
            else {

            }
         }
      }
      else {

         ui.infoLabel->setText (reply->errorString ());
      }

      reply->deleteLater ();
      reply = 0;
   }
}


void
StanceInit::closeEvent (QCloseEvent * event) {

   if (!_start) {

      init.app.quit ("Cancel Button Pressed");
      _save_session ();
   }
   else {

      _save_session ();
   }

   event->accept ();
}


void
StanceInit::_save_session () {

   Config session (StanceName);

   if (_cookieValue) {

      session.add_config (string_to_config ("coockie", "value", _cookieValue));
   }

   if (_authenticatedAs) {

      session.add_config (string_to_config ("authenticated", "as", _authenticatedAs));
   }

   session.add_config (float64_to_config ("frame", "time", _frameTime));
   set_session_config (init.app.get_context (), session);

   session = Config (StanceInitName);

   Boolean rememberMe (ui.rememberMe->isChecked ());
   if (rememberMe) {

      String username = qPrintable (ui.usernameLineEdit->text ());
      session.add_config (string_to_config ("user", "name", username));

      QByteArray passwd (qPrintable (ui.passwordLineEdit->text ()));

      QByteArray ba = local_calc_xor (passwd, StanceKey.toBase64 ());
      session.add_config (qbytearray_to_config ("password", ba));
   }

   session.add_config (boolean_to_config ("remember", "me", rememberMe));

   session.add_config (qbytearray_to_config ("geometry", saveGeometry ()));

   set_session_config (init.app.get_context (), session);
}


extern "C" {

DMZ_PLUGIN_FACTORY_LINK_SYMBOL void
dmz_init_stance (AppShellInitStruct &appInit) {

   StanceInit stanceInit (appInit);

   if (appInit.VersionFile) {

      Version version;

      if (xml_to_version (appInit.VersionFile, version, &appInit.app.log)) {

         QString vs = stanceInit.windowTitle ();
         vs += " (v";
         const String Tmp = version.get_version ().get_buffer ();
         if (Tmp) { vs += Tmp.get_buffer (); }
         else { vs += "Unknown"; }
         vs += ")";

         stanceInit.setWindowTitle (vs);
      }
   }

   local_restore_session (appInit, stanceInit);

   stanceInit.show ();
   stanceInit.raise ();

   while (stanceInit.isVisible ()) {

      // wait for log window to close
      QApplication::sendPostedEvents (0, -1);
      QApplication::processEvents (QEventLoop::WaitForMoreEvents);
   }

   if (appInit.app.is_running ()) {

      local_add_config ("config", appInit);

      CommandLine cl;
      cl.add_args (appInit.files);
      appInit.app.process_command_line (cl);

      if (!appInit.app.is_error ()) {

      }
   }
}

};
