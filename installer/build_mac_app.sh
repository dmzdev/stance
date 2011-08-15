#!/bin/sh
DEPTH=../../..
lmk -m opt -b
cp -RL $DEPTH/bin/macos-opt/STANCE.app $DEPTH
mkdir $DEPTH/STANCE.app/Contents/Frameworks/Qt
mkdir $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins
mkdir $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins/imageformats
mkdir $DEPTH/STANCE.app/Contents/Frameworks/v8/
cp $DEPTH/depend/Qt/QtCore $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtGui $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtXml $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtSvg $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtOpenGL $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtWebKit $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/QtNetwork $DEPTH/STANCE.app/Contents/Frameworks/Qt
cp $DEPTH/depend/Qt/imageformats/libqgif.dylib $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins/imageformats
cp $DEPTH/depend/Qt/imageformats/libqjpeg.dylib $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins/imageformats
cp $DEPTH/depend/Qt/imageformats/libqtiff.dylib $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins/imageformats
cp $DEPTH/depend/Qt/imageformats/libqsvg.dylib $DEPTH/STANCE.app/Contents/Frameworks/Qt/plugins/imageformats
if [ -d $DEPTH/depend/QtGui.framework/Versions/4/Resources/qt_menu.nib ] ; then
cp -R $DEPTH/depend/QtGui.framework/Versions/4/Resources/qt_menu.nib $DEPTH/STANCE.app/Contents/Resources
fi
cp $DEPTH/depend/v8/lib/libv8.dylib $DEPTH/STANCE.app/Contents/Frameworks/v8/
mkdir $DEPTH/STANCE
mv $DEPTH/STANCE.app $DEPTH/STANCE/
ln -s /Applications $DEPTH/STANCE/
TARGET=$DEPTH/STANCE-`cat $DEPTH/tmp/macos-opt/stanceapp/versionnumber.txt`-`cat $DEPTH/tmp/macos-opt/stanceapp/buildnumber.txt`.dmg
hdiutil create -srcfolder $DEPTH/STANCE/ $TARGET
hdiutil internet-enable -yes -verbose $TARGET
rm -rf $DEPTH/STANCE/
INSTALLER_PATH=$DEPTH/installers
if [ ! -d $INSTALLER_PATH ] ; then
   mkdir $INSTALLER_PATH
fi
mv $TARGET $INSTALLER_PATH
