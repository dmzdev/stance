#!/bin/sh

. ../scripts/envsetup.sh

export DMZ_APP_NAME=stance

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/archive.xml config/common.xml config/js.xml config/input.xml config/game.xml config/webservices.xml config/resource.xml config/runtime.xml config/debug.xml $*
