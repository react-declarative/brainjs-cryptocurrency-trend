#!/usr/bin/env bash
npm install
npm run build
cd ./packages/api-kucoin
npm install
npm run build
npm run start:prod
