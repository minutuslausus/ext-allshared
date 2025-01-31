{
  "name": "bundler",
  "version": "7.1.0",
  "description": "bundler",
  "main": "index.js",
  "config": {
    "packagename": "{packagename}",
    "buildfolder": "build"
  },
  "scripts": {
    "start": "npm run clean && npx sencha app build && npm run webpackprod && npm run copyextprod",
    "clean": "rimraf build",
    "webpackprod": "webpack --display-modules --env.packagename=$npm_package_config_packagename --env.environment=production",
    "copyextprod": "cp ./$npm_package_config_buildfolder/$npm_package_config_packagename/ext.$npm_package_config_packagename.prod.js ./dist/ext.$npm_package_config_packagename.js",


    "startorig": "npm run clean && npm run sencha && npm run both && npm run gzipall && npm run copytomin && npm run copytotester",
    "start2": "rimraf dist && rimraf build && npx sencha app build && npm run copyux && npm run copyfont && npm run copyimages && webpack --env.packagename=$npm_package_config_packagename --env.environment=development",
    "start3": "npm run clean && npx sencha app build && webpack --env.packagename=$npm_package_config_packagename --env.environment=development  && webpack --env.packagename=$npm_package_config_packagename --env.environment=production",
    "both": "webpack --env.packagename=$npm_package_config_packagename --env.environment=development  && webpack --env.packagename=$npm_package_config_packagename --env.environment=production",
    "copyextdev": "cp ./$npm_package_config_buildfolder/$npm_package_config_packagename/ext.$npm_package_config_packagename.dev.js ./dist",
    "copyux": "cp -R ./ux ./$npm_package_config_buildfolder/$npm_package_config_packagename",
    "copyfont": "cp -R ./font-awesome ./$npm_package_config_buildfolder/$npm_package_config_packagename",
    "copyimages": "cp -R ./images ./$npm_package_config_buildfolder/$npm_package_config_packagename",
    "sencha": "npx sencha app build && npm run mkdist && npm run copyextdev && npm run copyextprod",
    "mkdist": "mkdir dist",
    "copyextdev2": "cp -R ./$npm_package_config_buildfolder/all/ext.all.dev.js ./dist/",
    "copyextprod2": "cp -R ./$npm_package_config_buildfolder/all/ext.all.prod.js ./dist/",
    "both2": "webpack --env.packagename=all --env.environment=development && webpack --env.packagename=all --env.environment=production",
    "gzipall": "npm run gzipewc && npm run gzipext && npm run gzipcss",
    "gzipewc": "gzip -c dist/ewc.production.js > dist/ewc.production.js.gz",
    "gzipext": "gzip -c dist/ext.all.js > dist/ext.all.prod.js.gz",
    "gzipcss": "gzip -c dist/css.production.js > dist/css.production.js.gz",
    "copytomin": "rimraf ../ext-web-components-min/dist/ && cp -R dist/ ../ext-web-components-min/dist/",
    "copytotester": "rimraf ../../demos/extjs-tester/dist/ && cp -R dist/ ../../demos/extjs-tester/dist/",
    "copy2": "cp $npm_package_config_buildfolder/z.js ../sencha-studio-extension/src/scripts2",
    "build:watch": "webpack --config config/webpack.prod.js --watch",
    "serve": "webpack-dev-server --config config/webpack.dev.js"
  },
  "author": "Marc Gusmano",
  "license": "MIT",
  "devDependencies": {
    "@sencha/cmd": "~7.0.0",
    "@sencha/ext": "~7.0.0",
    "@sencha/ext-calendar": "~7.0.0",
    "@sencha/ext-charts": "~7.0.0",
    "@sencha/ext-d3": "~7.0.0",
    "@sencha/ext-exporter": "~7.0.0",
    "@sencha/ext-froala-editor": "~7.0.0",
    "@sencha/ext-modern": "~7.0.0",
    "@sencha/ext-modern-theme-material": "~7.0.0",
    "@sencha/ext-modern-treegrid": "~7.0.0",
    "@sencha/ext-pivot": "~7.0.0",
    "@sencha/ext-pivot-d3": "~7.0.0",
    "@sencha/ext-ux": "~7.0.0",
    "@sencha/ext-web-components": "~7.0.0",
    "@sencha/ext-web-components-renderercell": "~7.0.0",
    "@sencha/ext-webpack-plugin": "~7.0.0",
    "rimraf": "^2.6.3",
    "script-loader": "^0.7.2",
    "url-loader": "^2.0.1",
    "file-loader": "^4.0.0",
    "style-loader": "^0.23.1",
    "css-loader": "^3.0.0",
    "webpack": "^4.35.0",
    "webpack-cli": "^3.3.5",
    "webpack-dev-server": "^3.7.2"
  },
  "dependencies": {
    "@webcomponents/webcomponentsjs": "^2.2.10"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/mgusmano"
  }
}
