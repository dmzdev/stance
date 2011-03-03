#!/bin/sh

. ../scripts/envsetup.sh
# export STANCE_LOG=true
export STANCE_WORKING_DIR="./"
$RUN_DEBUG$BIN_HOME/stance $*
