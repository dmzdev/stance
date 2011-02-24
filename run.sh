#!/bin/sh

. ../scripts/envsetup.sh

export DMZ_APP_NAME=stance
export STANCE_WORKING_DIR="./"

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/canvas.xml config/common.xml config/input.xml config/js.xml config/resource.xml config/runtime.xml config/webservices.xml $*
