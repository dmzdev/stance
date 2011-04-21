#!/bin/sh
DEPTH=../../..
rm -f ./stancesetup.exe
lmk -m opt -b
$DEPTH/depend/InnoSetup5/ISCC.exe stance.iss
INSTALLER_PATH=$DEPTH/installers
if [ ! -d $INSTALLER_PATH ] ; then
   mkdir $INSTALLER_PATH
fi
cp stancesetup.exe $INSTALLER_PATH/stance-`cat $DEPTH/tmp/win32-opt/stanceapp/versionnumber.txt`-`cat $DEPTH/tmp/win32-opt/stanceapp/buildnumber.txt`.exe
