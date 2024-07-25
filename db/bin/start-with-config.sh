#!/usr/bin/env bash

# Copied from https://github.com/mrc-ide/packit/blob/main/db/bin/start-with-config.sh

set -ex
CONFIG_FILE=$1
shift
exec docker-entrypoint.sh $* -c config_file=$CONFIG_FILE
