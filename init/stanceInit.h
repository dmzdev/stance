#ifndef STANCE_INIT_DOT_H
#define STANCE_INIT_DOT_H

#include <dmzAppShellExt.h>
#include <QtGui/QDialog>
#include <ui_stanceInit.h>

class QNetworkAccessManager;


namespace dmz {

class StanceInit : public QDialog {

   Q_OBJECT

   public:
      StanceInit (AppShellInitStruct &init);
      ~StanceInit ();

      AppShellInitStruct &init;

      String get_user () const;
      void set_user (const String &Value);

      String get_password () const;
      void set_password (const String  &Value);

   protected Q_SLOTS:
      void on_buttonBox_accepted ();
      void on_buttonBox_rejected ();
      void _handle_fetch_session ();

   protected:
      void _fetch_session ();
      virtual void closeEvent (QCloseEvent * event);
      void _save_session ();
      void _load_session ();

      Ui::StanceInitForm _ui;
      QNetworkAccessManager *_netManager;
      Float64 _frameTime;
      String _cookieValue;
      String _authenticatedAs;
      Boolean _start;
};

};

#endif // STANCE_INIT_DOT_H
