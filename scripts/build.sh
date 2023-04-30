#!/usr/bin/env bash
npm install
npm run build
cd ./packages
for D in `find . -maxdepth 1 -not -path "." -not -path "./.*" -type d`
do
    cd $D
    npm install
    npm run build
    cd ..
done
cd ..
