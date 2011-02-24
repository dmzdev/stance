#!/bin/sh

. ../scripts/envsetup.sh

export DMZ_APP_NAME=stance

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/canvas.xml config/common.xml config/js.xml config/input.xml config/game.xml config/resource.xml config/runtime.xml $*
