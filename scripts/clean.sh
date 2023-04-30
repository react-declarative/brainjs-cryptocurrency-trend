#!/usr/bin/env bash
rm -rf node_modules
cd ./packages
for D in `find . -maxdepth 1 -not -path "." -not -path "./.*" -type d`
do
    cd $D
    rm -rf node_modules
    cd ..
done
cd ..
