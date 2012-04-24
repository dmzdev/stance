#!/bin/sh

# Options:
# ./pull_build_publish_win.sh [-r repoName] [-b branchName] [-c channelName]

REPO="http://www.github.com/dmzdev/stance"
BRANCH="master"
CHANNEL="stable"

while getopts ":r:b:c:" opt; do
    case $opt in
	r)
	    echo "Using $OPTARG as repo to pull from"
	    REPO=$OPTARG
	    ;;
	b)
	    echo "Using $OPTARG as branch to pull from"
	    BRANCH=$OPTARG
	    ;;
	c)
	    echo "Using $OPTARG as channel to push to."
	    CHANNEL=$OPTARG
	    ;;
	\?)
	    echo "Invalid Operator."
	    ;;
    esac
done

echo "Pulling From: $REPO"
echo "Using Branch: $BRANCH"
echo "Pushing to channel: $CHANNEL"

git pull $REPO $BRANCH
./build_win_app.sh
./publish_win_app.sh $CHANNEL
