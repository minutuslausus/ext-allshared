"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._getDefaultVars = _getDefaultVars;
exports._extractFromSource = _extractFromSource;
exports._toProd = _toProd;
exports._toDev = _toDev;
exports._getAllComponents = _getAllComponents;
exports._writeFilesToProdFolder = _writeFilesToProdFolder;

function _getDefaultVars() {
  return {
    touchFile: '/src/themer.ts',
    watchStarted: false,
    buildstep: '1 of 1',
    firstTime: true,
    firstCompile: true,
    browserCount: 0,
    manifest: null,
    extPath: 'ext',
    pluginErrors: [],
    deps: [],
    usedExtComponents: [],
    rebuild: true
  };
}

function _extractFromSource(module, options, compilation, extComponents) {
  const logv = require('./pluginUtil').logv;

  const verbose = options.verbose;
  logv(verbose, 'FUNCTION _extractFromSource');
  var js = module._source._value;
  var statements = [];

  var generate = require("@babel/generator").default;

  var parse = require("babylon").parse;

  var traverse = require("ast-traverse");

  var ast = parse(js, {
    plugins: ['typescript', 'flow', 'doExpressions', 'objectRestSpread', 'classProperties', 'exportDefaultFrom', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport'],
    sourceType: 'module'
  });
  traverse(ast, {
    pre: function (node) {
      if (node.type === 'CallExpression' && node.callee && node.callee.object && node.callee.object.name === 'Ext') {
        statements.push(generate(node).code);
      }

      if (node.type === 'StringLiteral') {
        let code = node.value;

        for (var i = 0; i < code.length; ++i) {
          if (code.charAt(i) == '<') {
            if (code.substr(i, 4) == '<!--') {
              i += 4;
              i += code.substr(i).indexOf('-->') + 3;
            } else if (code.charAt(i + 1) !== '/') {
              var start = code.substring(i);
              var spaceEnd = start.indexOf(' ');
              var newlineEnd = start.indexOf('\n');
              var tagEnd = start.indexOf('>');
              var end = Math.min(spaceEnd, newlineEnd, tagEnd);

              if (end >= 0) {
                //changed this from 1 to five when adding ext- to elements
                var xtype = require('./pluginUtil')._toXtype(start.substring(5, end));

                if (extComponents.includes(xtype)) {
                  var theValue = node.value.toLowerCase();

                  if (theValue.indexOf('doctype html') == -1) {
                    var type = {
                      xtype: xtype
                    };
                    let config = JSON.stringify(type);
                    statements.push(`Ext.create(${config})`);
                  }
                }

                i += end;
              }
            }
          }
        }
      }
    }
  });
  return statements;
}

function changeIt(o) {
  const path = require('path');

  const fsx = require('fs-extra');

  const wherePath = path.resolve(process.cwd(), o.where);
  var js = fsx.readFileSync(wherePath).toString();
  var newJs = js.replace(o.from, o.to);
  fsx.writeFileSync(wherePath, newJs, 'utf-8', () => {
    return;
  });
}

function _toProd(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _toProd');

  const fsx = require('fs-extra');

  const fs = require('fs');

  const mkdirp = require('mkdirp');

  const path = require('path');

  const toolkit = 'modern';
  const Toolkit = toolkit.charAt(0).toUpperCase() + toolkit.slice(1);
  const pathExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-${toolkit}-prod`);

  if (!fs.existsSync(pathExtAngularProd)) {
    mkdirp.sync(pathExtAngularProd);

    const t = require('./artifacts').extAngularModule('', '', '');

    fsx.writeFileSync(`${pathExtAngularProd}/ext-angular-${toolkit}.module.ts`, t, 'utf-8', () => {
      return;
    });
  }

  var o = {};
  o.where = 'src/app/app.module.ts';
  o.from = `import { ExtAngular${Toolkit}Module } from '@sencha/ext-angular-${toolkit}'`;
  o.to = `import { ExtAngular${Toolkit}Module } from './ext-angular-${toolkit}-prod/ext-angular-${toolkit}.module'`;
  changeIt(o); //   o = {}
  //   o.where = 'src/main.ts'
  //   o.from = `bootstrapModule( AppModule );`
  //   o.to = `enableProdMode();bootstrapModule(AppModule);`
  //   changeIt(o)
}

function _toDev(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _toDev');

  const path = require('path');

  const toolkit = 'modern';
  const Toolkit = toolkit.charAt(0).toUpperCase() + toolkit.slice(1);
  const pathExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-${toolkit}-prod`);

  require('rimraf').sync(pathExtAngularProd);

  var o = {};
  o.where = 'src/app/app.module.ts';
  o.from = `import { ExtAngular-${Toolkit}Module } from './ext-angular-${toolkit}-prod/ext-angular-${toolkit}.module'`;
  o.to = `import { ExtAngular-${Toolkit}Module } from '@sencha/ext-angular-${toolkit}'`;
  changeIt(o); //   o = {}
  //   o.where = 'src/main.ts'
  //   o.from = `enableProdMode();bootstrapModule(AppModule);`
  //   o.to = `bootstrapModule( AppModule );`
  //   changeIt(o)
}

function _getAllComponents(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _getAllComponents');

  const path = require('path');

  const fsx = require('fs-extra');

  const toolkit = 'modern';
  const Toolkit = toolkit.charAt(0).toUpperCase() + toolkit.slice(1); //    log(vars.app, `Getting all referenced ext-${options.framework} modules`)

  var extComponents = [];
  const packageLibPath = path.resolve(process.cwd(), `node_modules/@sencha/ext-angular-${toolkit}/lib`);
  var files = fsx.readdirSync(packageLibPath);
  files.forEach(fileName => {
    // if (fileName && fileName.substr(0, 4) == 'ext-') {
    //   var end = fileName.substr(4).indexOf('.component')
    //   if (end >= 0) {
    //     extComponents.push(fileName.substring(4, end + 4))
    //   }
    // }
    if (fileName && fileName.substr(0, 3) == 'Ext') {
      var end = fileName.substr(3).indexOf('.ts');

      if (end >= 0) {
        extComponents.push(fileName.substring(3, end + 3).toLowerCase());
      }
    }
  });
  log(vars.app, `Writing all referenced ext-${options.framework} modules`);
  return extComponents;
}

function _writeFilesToProdFolder(vars, options) {
  const log = require('./pluginUtil').log;

  const logv = require('./pluginUtil').logv;

  logv(options.verbose, 'FUNCTION _writeFilesToProdFolder');

  const path = require('path');

  const fsx = require('fs-extra');

  const toolkit = 'modern';
  const Toolkit = toolkit.charAt(0).toUpperCase() + toolkit.slice(1);
  const packageLibPath = path.resolve(process.cwd(), `node_modules/@sencha/ext-angular-${toolkit}/lib`);
  const pathToExtAngularProd = path.resolve(process.cwd(), `src/app/ext-angular-${toolkit}-prod`);
  const string = 'Ext.create({\"xtype\":\"';
  vars.deps.forEach(code => {
    var index = code.indexOf(string);

    if (index >= 0) {
      code = code.substring(index + string.length);
      var end = code.indexOf('\"');
      vars.usedExtComponents.push(code.substr(0, end));
    }
  });
  vars.usedExtComponents = [...new Set(vars.usedExtComponents)];
  var writeToPathWritten = false;
  var moduleVars = {
    imports: '',
    exports: '',
    declarations: ''
  };
  vars.usedExtComponents.forEach(xtype => {
    var capclassname = xtype.charAt(0).toUpperCase() + xtype.replace(/-/g, "_").slice(1);
    moduleVars.imports = moduleVars.imports + `import { Ext${capclassname}Component } from './ext-${xtype}.component';\n`;
    moduleVars.exports = moduleVars.exports + `    Ext${capclassname}Component,\n`;
    moduleVars.declarations = moduleVars.declarations + `    Ext${capclassname}Component,\n`;
    var classFile = `ext-${xtype}.component.ts`;
    const contents = fsx.readFileSync(`${packageLibPath}/${classFile}`).toString();
    fsx.writeFileSync(`${pathToExtAngularProd}/${classFile}`, contents, 'utf-8', () => {
      return;
    });
    writeToPathWritten = true;
  });

  if (writeToPathWritten) {
    var t = require('./artifacts').extAngularModule(moduleVars.imports, moduleVars.exports, moduleVars.declarations);

    fsx.writeFileSync(`${pathToExtAngularProd}/ext-angular-${toolkit}.module.ts`, t, 'utf-8', () => {
      return;
    });
  }

  const baseContent = fsx.readFileSync(`${packageLibPath}/eng-base.ts`).toString();
  fsx.writeFileSync(`${pathToExtAngularProd}/eng-base.ts`, baseContent, 'utf-8', () => {
    return;
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hbmd1bGFyVXRpbC5qcyJdLCJuYW1lcyI6WyJfZ2V0RGVmYXVsdFZhcnMiLCJ0b3VjaEZpbGUiLCJ3YXRjaFN0YXJ0ZWQiLCJidWlsZHN0ZXAiLCJmaXJzdFRpbWUiLCJmaXJzdENvbXBpbGUiLCJicm93c2VyQ291bnQiLCJtYW5pZmVzdCIsImV4dFBhdGgiLCJwbHVnaW5FcnJvcnMiLCJkZXBzIiwidXNlZEV4dENvbXBvbmVudHMiLCJyZWJ1aWxkIiwiX2V4dHJhY3RGcm9tU291cmNlIiwibW9kdWxlIiwib3B0aW9ucyIsImNvbXBpbGF0aW9uIiwiZXh0Q29tcG9uZW50cyIsImxvZ3YiLCJyZXF1aXJlIiwidmVyYm9zZSIsImpzIiwiX3NvdXJjZSIsIl92YWx1ZSIsInN0YXRlbWVudHMiLCJnZW5lcmF0ZSIsImRlZmF1bHQiLCJwYXJzZSIsInRyYXZlcnNlIiwiYXN0IiwicGx1Z2lucyIsInNvdXJjZVR5cGUiLCJwcmUiLCJub2RlIiwidHlwZSIsImNhbGxlZSIsIm9iamVjdCIsIm5hbWUiLCJwdXNoIiwiY29kZSIsInZhbHVlIiwiaSIsImxlbmd0aCIsImNoYXJBdCIsInN1YnN0ciIsImluZGV4T2YiLCJzdGFydCIsInN1YnN0cmluZyIsInNwYWNlRW5kIiwibmV3bGluZUVuZCIsInRhZ0VuZCIsImVuZCIsIk1hdGgiLCJtaW4iLCJ4dHlwZSIsIl90b1h0eXBlIiwiaW5jbHVkZXMiLCJ0aGVWYWx1ZSIsInRvTG93ZXJDYXNlIiwiY29uZmlnIiwiSlNPTiIsInN0cmluZ2lmeSIsImNoYW5nZUl0IiwibyIsInBhdGgiLCJmc3giLCJ3aGVyZVBhdGgiLCJyZXNvbHZlIiwicHJvY2VzcyIsImN3ZCIsIndoZXJlIiwicmVhZEZpbGVTeW5jIiwidG9TdHJpbmciLCJuZXdKcyIsInJlcGxhY2UiLCJmcm9tIiwidG8iLCJ3cml0ZUZpbGVTeW5jIiwiX3RvUHJvZCIsInZhcnMiLCJsb2ciLCJmcyIsIm1rZGlycCIsInRvb2xraXQiLCJUb29sa2l0IiwidG9VcHBlckNhc2UiLCJzbGljZSIsInBhdGhFeHRBbmd1bGFyUHJvZCIsImV4aXN0c1N5bmMiLCJzeW5jIiwidCIsImV4dEFuZ3VsYXJNb2R1bGUiLCJfdG9EZXYiLCJfZ2V0QWxsQ29tcG9uZW50cyIsInBhY2thZ2VMaWJQYXRoIiwiZmlsZXMiLCJyZWFkZGlyU3luYyIsImZvckVhY2giLCJmaWxlTmFtZSIsImFwcCIsImZyYW1ld29yayIsIl93cml0ZUZpbGVzVG9Qcm9kRm9sZGVyIiwicGF0aFRvRXh0QW5ndWxhclByb2QiLCJzdHJpbmciLCJpbmRleCIsIlNldCIsIndyaXRlVG9QYXRoV3JpdHRlbiIsIm1vZHVsZVZhcnMiLCJpbXBvcnRzIiwiZXhwb3J0cyIsImRlY2xhcmF0aW9ucyIsImNhcGNsYXNzbmFtZSIsImNsYXNzRmlsZSIsImNvbnRlbnRzIiwiYmFzZUNvbnRlbnQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7QUFFTyxTQUFTQSxlQUFULEdBQTJCO0FBQ2hDLFNBQU87QUFDTEMsSUFBQUEsU0FBUyxFQUFFLGdCQUROO0FBRUxDLElBQUFBLFlBQVksRUFBRyxLQUZWO0FBR0xDLElBQUFBLFNBQVMsRUFBRSxRQUhOO0FBSUxDLElBQUFBLFNBQVMsRUFBRyxJQUpQO0FBS0xDLElBQUFBLFlBQVksRUFBRSxJQUxUO0FBTUxDLElBQUFBLFlBQVksRUFBRyxDQU5WO0FBT0xDLElBQUFBLFFBQVEsRUFBRSxJQVBMO0FBUUxDLElBQUFBLE9BQU8sRUFBRSxLQVJKO0FBU0xDLElBQUFBLFlBQVksRUFBRSxFQVRUO0FBVUxDLElBQUFBLElBQUksRUFBRSxFQVZEO0FBV0xDLElBQUFBLGlCQUFpQixFQUFFLEVBWGQ7QUFZTEMsSUFBQUEsT0FBTyxFQUFFO0FBWkosR0FBUDtBQWNEOztBQUVNLFNBQVNDLGtCQUFULENBQTRCQyxNQUE1QixFQUFvQ0MsT0FBcEMsRUFBNkNDLFdBQTdDLEVBQTBEQyxhQUExRCxFQUF5RTtBQUM5RSxRQUFNQyxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxjQUFELENB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LENBQVAsQ0FBdUJ3RSxnQkFBdkIsQ0FDTmdCLFVBQVUsQ0FBQ0MsT0FETCxFQUNjRCxVQUFVLENBQUNFLE9BRHpCLEVBQ2tDRixVQUFVLENBQUNHLFlBRDdDLENBQVI7O0FBR0E3QyxJQUFBQSxHQUFHLENBQUNZLGFBQUosQ0FBbUIsR0FBRXlCLG9CQUFxQixnQkFBZW5CLE9BQVEsWUFBakUsRUFBOEVPLENBQTlFLEVBQWlGLE9BQWpGLEVBQTBGLE1BQUk7QUFBQztBQUFPLEtBQXRHO0FBQ0Q7O0FBRUQsUUFBTXdCLFdBQVcsR0FBR2pELEdBQUcsQ0FBQ00sWUFBSixDQUFrQixHQUFFdUIsY0FBZSxjQUFuQyxFQUFrRHRCLFFBQWxELEVBQXBCO0FBQ0FQLEVBQUFBLEdBQUcsQ0FBQ1ksYUFBSixDQUFtQixHQUFFeUIsb0JBQXFCLGNBQTFDLEVBQXlEWSxXQUF6RCxFQUFzRSxPQUF0RSxFQUErRSxNQUFJO0FBQUM7QUFBTyxHQUEzRjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfZ2V0RGVmYXVsdFZhcnMoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHRvdWNoRmlsZTogJy9zcmMvdGhlbWVyLnRzJyxcclxuICAgIHdhdGNoU3RhcnRlZCA6IGZhbHNlLFxyXG4gICAgYnVpbGRzdGVwOiAnMSBvZiAxJyxcclxuICAgIGZpcnN0VGltZSA6IHRydWUsXHJcbiAgICBmaXJzdENvbXBpbGU6IHRydWUsXHJcbiAgICBicm93c2VyQ291bnQgOiAwLFxyXG4gICAgbWFuaWZlc3Q6IG51bGwsXHJcbiAgICBleHRQYXRoOiAnZXh0JyxcclxuICAgIHBsdWdpbkVycm9yczogW10sXHJcbiAgICBkZXBzOiBbXSxcclxuICAgIHVzZWRFeHRDb21wb25lbnRzOiBbXSxcclxuICAgIHJlYnVpbGQ6IHRydWVcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfZXh0cmFjdEZyb21Tb3VyY2UobW9kdWxlLCBvcHRpb25zLCBjb21waWxhdGlvbiwgZXh0Q29tcG9uZW50cykge1xyXG4gIGNvbnN0IGxvZ3YgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5sb2d2XHJcbiAgY29uc3QgdmVyYm9zZSA9IG9wdGlvbnMudmVyYm9zZVxyXG4gIGxvZ3YodmVyYm9zZSwnRlVOQ1RJT04gX2V4dHJhY3RGcm9tU291cmNlJylcclxuICB2YXIganMgPSBtb2R1bGUuX3NvdXJjZS5fdmFsdWVcclxuXHJcbiAgdmFyIHN0YXRlbWVudHMgPSBbXVxyXG5cclxuICB2YXIgZ2VuZXJhdGUgPSByZXF1aXJlKFwiQGJhYmVsL2dlbmVyYXRvclwiKS5kZWZhdWx0XHJcbiAgdmFyIHBhcnNlID0gcmVxdWlyZShcImJhYnlsb25cIikucGFyc2VcclxuICB2YXIgdHJhdmVyc2UgPSByZXF1aXJlKFwiYXN0LXRyYXZlcnNlXCIpXHJcblxyXG4gIHZhciBhc3QgPSBwYXJzZShqcywge1xyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICAndHlwZXNjcmlwdCcsXHJcbiAgICAgICdmbG93JyxcclxuICAgICAgJ2RvRXhwcmVzc2lvbnMnLFxyXG4gICAgICAnb2JqZWN0UmVzdFNwcmVhZCcsXHJcbiAgICAgICdjbGFzc1Byb3BlcnRpZXMnLFxyXG4gICAgICAnZXhwb3J0RGVmYXVsdEZyb20nLFxyXG4gICAgICAnZXhwb3J0RXh0ZW5zaW9ucycsXHJcbiAgICAgICdhc3luY0dlbmVyYXRvcnMnLFxyXG4gICAgICAnZnVuY3Rpb25CaW5kJyxcclxuICAgICAgJ2Z1bmN0aW9uU2VudCcsXHJcbiAgICAgICdkeW5hbWljSW1wb3J0J1xyXG4gICAgXSxcclxuICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnXHJcbiAgfSlcclxuXHJcbiAgdHJhdmVyc2UoYXN0LCB7XHJcbiAgICBwcmU6IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgIGlmIChub2RlLnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgJiYgbm9kZS5jYWxsZWUgJiYgbm9kZS5jYWxsZWUub2JqZWN0ICYmIG5vZGUuY2FsbGVlLm9iamVjdC5uYW1lID09PSAnRXh0Jykge1xyXG4gICAgICAgIHN0YXRlbWVudHMucHVzaChnZW5lcmF0ZShub2RlKS5jb2RlKVxyXG4gICAgICB9XHJcbiAgICAgIGlmKG5vZGUudHlwZSA9PT0gJ1N0cmluZ0xpdGVyYWwnKSB7XHJcbiAgICAgICAgbGV0IGNvZGUgPSBub2RlLnZhbHVlXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2RlLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICBpZiAoY29kZS5jaGFyQXQoaSkgPT0gJzwnKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2RlLnN1YnN0cihpLCA0KSA9PSAnPCEtLScpIHtcclxuICAgICAgICAgICAgICBpICs9IDRcclxuICAgICAgICAgICAgICBpICs9IGNvZGUuc3Vic3RyKGkpLmluZGV4T2YoJy0tPicpICsgM1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUuY2hhckF0KGkrMSkgIT09ICcvJykge1xyXG4gICAgICAgICAgICAgIHZhciBzdGFydCA9IGNvZGUuc3Vic3RyaW5nKGkpXHJcbiAgICAgICAgICAgICAgdmFyIHNwYWNlRW5kID0gc3RhcnQuaW5kZXhPZignICcpXHJcbiAgICAgICAgICAgICAgdmFyIG5ld2xpbmVFbmQgPSBzdGFydC5pbmRleE9mKCdcXG4nKVxyXG4gICAgICAgICAgICAgIHZhciB0YWdFbmQgPSBzdGFydC5pbmRleE9mKCc+JylcclxuICAgICAgICAgICAgICB2YXIgZW5kID0gTWF0aC5taW4oc3BhY2VFbmQsIG5ld2xpbmVFbmQsIHRhZ0VuZClcclxuICAgICAgICAgICAgICBpZiAoZW5kID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgLy9jaGFuZ2VkIHRoaXMgZnJvbSAxIHRvIGZpdmUgd2hlbiBhZGRpbmcgZXh0LSB0byBlbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgdmFyIHh0eXBlID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykuX3RvWHR5cGUoc3RhcnQuc3Vic3RyaW5nKDUsIGVuZCkpXHJcbiAgICAgICAgICAgICAgICBpZihleHRDb21wb25lbnRzLmluY2x1ZGVzKHh0eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgdGhlVmFsdWUgPSBub2RlLnZhbHVlLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgaWYgKHRoZVZhbHVlLmluZGV4T2YoJ2RvY3R5cGUgaHRtbCcpID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSB7eHR5cGU6IHh0eXBlfVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb25maWcgPSBKU09OLnN0cmluZ2lmeSh0eXBlKVxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaChgRXh0LmNyZWF0ZSgke2NvbmZpZ30pYClcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaSArPSBlbmRcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KVxyXG5cclxuICByZXR1cm4gc3RhdGVtZW50c1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGFuZ2VJdChvKSB7XHJcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxyXG4gIGNvbnN0IGZzeCA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcclxuICBjb25zdCB3aGVyZVBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgby53aGVyZSlcclxuICB2YXIganMgPSBmc3gucmVhZEZpbGVTeW5jKHdoZXJlUGF0aCkudG9TdHJpbmcoKVxyXG4gIHZhciBuZXdKcyA9IGpzLnJlcGxhY2Uoby5mcm9tLG8udG8pO1xyXG4gIGZzeC53cml0ZUZpbGVTeW5jKHdoZXJlUGF0aCwgbmV3SnMsICd1dGYtOCcsICgpPT57cmV0dXJufSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF90b1Byb2QodmFycywgb3B0aW9ucykge1xyXG4gIGNvbnN0IGxvZyA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ1xyXG4gIGNvbnN0IGxvZ3YgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5sb2d2XHJcbiAgbG9ndihvcHRpb25zLnZlcmJvc2UsJ0ZVTkNUSU9OIF90b1Byb2QnKVxyXG4gIGNvbnN0IGZzeCA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcclxuICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJylcclxuICBjb25zdCBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAnKVxyXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuXHJcbiAgY29uc3QgdG9vbGtpdCA9ICdtb2Rlcm4nO1xyXG4gIGNvbnN0IFRvb2xraXQgPSB0b29sa2l0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdG9vbGtpdC5zbGljZSgxKTtcclxuXHJcbiAgY29uc3QgcGF0aEV4dEFuZ3VsYXJQcm9kID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGBzcmMvYXBwL2V4dC1hbmd1bGFyLSR7dG9vbGtpdH0tcHJvZGApO1xyXG4gIGlmICghZnMuZXhpc3RzU3luYyhwYXRoRXh0QW5ndWxhclByb2QpKSB7XHJcbiAgICBta2RpcnAuc3luYyhwYXRoRXh0QW5ndWxhclByb2QpXHJcbiAgICBjb25zdCB0ID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKS5leHRBbmd1bGFyTW9kdWxlKCcnLCAnJywgJycpXHJcbiAgICBmc3gud3JpdGVGaWxlU3luYyhgJHtwYXRoRXh0QW5ndWxhclByb2R9L2V4dC1hbmd1bGFyLSR7dG9vbGtpdH0ubW9kdWxlLnRzYCwgdCwgJ3V0Zi04JywgKCkgPT4ge1xyXG4gICAgICByZXR1cm5cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICB2YXIgbyA9IHt9XHJcbiAgby53aGVyZSA9ICdzcmMvYXBwL2FwcC5tb2R1bGUudHMnXHJcbiAgby5mcm9tID0gYGltcG9ydCB7IEV4dEFuZ3VsYXIke1Rvb2xraXR9TW9kdWxlIH0gZnJvbSAnQHNlbmNoYS9leHQtYW5ndWxhci0ke3Rvb2xraXR9J2BcclxuICBvLnRvID0gYGltcG9ydCB7IEV4dEFuZ3VsYXIke1Rvb2xraXR9TW9kdWxlIH0gZnJvbSAnLi9leHQtYW5ndWxhci0ke3Rvb2xraXR9LXByb2QvZXh0LWFuZ3VsYXItJHt0b29sa2l0fS5tb2R1bGUnYFxyXG4gIGNoYW5nZUl0KG8pXHJcblxyXG4vLyAgIG8gPSB7fVxyXG4vLyAgIG8ud2hlcmUgPSAnc3JjL21haW4udHMnXHJcbi8vICAgby5mcm9tID0gYGJvb3RzdHJhcE1vZHVsZSggQXBwTW9kdWxlICk7YFxyXG4vLyAgIG8udG8gPSBgZW5hYmxlUHJvZE1vZGUoKTtib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlKTtgXHJcbi8vICAgY2hhbmdlSXQobylcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF90b0Rldih2YXJzLCBvcHRpb25zKSB7XHJcbiAgY29uc3QgbG9nID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9nXHJcbiAgY29uc3QgbG9ndiA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ3ZcclxuICBsb2d2KG9wdGlvbnMudmVyYm9zZSwnRlVOQ1RJT04gX3RvRGV2JylcclxuICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXHJcblxyXG4gIGNvbnN0IHRvb2xraXQgPSAnbW9kZXJuJztcclxuICBjb25zdCBUb29sa2l0ID0gdG9vbGtpdC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRvb2xraXQuc2xpY2UoMSk7XHJcblxyXG4gIGNvbnN0IHBhdGhFeHRBbmd1bGFyUHJvZCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBgc3JjL2FwcC9leHQtYW5ndWxhci0ke3Rvb2xraXR9LXByb2RgKTtcclxuICByZXF1aXJlKCdyaW1yYWYnKS5zeW5jKHBhdGhFeHRBbmd1bGFyUHJvZCk7XHJcblxyXG4gIHZhciBvID0ge31cclxuICBvLndoZXJlID0gJ3NyYy9hcHAvYXBwLm1vZHVsZS50cydcclxuICBvLmZyb20gPSBgaW1wb3J0IHsgRXh0QW5ndWxhci0ke1Rvb2xraXR9TW9kdWxlIH0gZnJvbSAnLi9leHQtYW5ndWxhci0ke3Rvb2xraXR9LXByb2QvZXh0LWFuZ3VsYXItJHt0b29sa2l0fS5tb2R1bGUnYFxyXG4gIG8udG8gPSBgaW1wb3J0IHsgRXh0QW5ndWxhci0ke1Rvb2xraXR9TW9kdWxlIH0gZnJvbSAnQHNlbmNoYS9leHQtYW5ndWxhci0ke3Rvb2xraXR9J2BcclxuICBjaGFuZ2VJdChvKVxyXG5cclxuLy8gICBvID0ge31cclxuLy8gICBvLndoZXJlID0gJ3NyYy9tYWluLnRzJ1xyXG4vLyAgIG8uZnJvbSA9IGBlbmFibGVQcm9kTW9kZSgpO2Jvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUpO2BcclxuLy8gICBvLnRvID0gYGJvb3RzdHJhcE1vZHVsZSggQXBwTW9kdWxlICk7YFxyXG4vLyAgIGNoYW5nZUl0KG8pXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX2dldEFsbENvbXBvbmVudHModmFycywgb3B0aW9ucykge1xyXG4gIGNvbnN0IGxvZyA9IHJlcXVpcmUoJy4vcGx1Z2luVXRpbCcpLmxvZ1xyXG4gIGNvbnN0IGxvZ3YgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5sb2d2XHJcbiAgbG9ndihvcHRpb25zLnZlcmJvc2UsJ0ZVTkNUSU9OIF9nZXRBbGxDb21wb25lbnRzJylcclxuXHJcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxyXG4gIGNvbnN0IGZzeCA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcclxuXHJcbiAgY29uc3QgdG9vbGtpdCA9ICdtb2Rlcm4nO1xyXG4gIGNvbnN0IFRvb2xraXQgPSB0b29sa2l0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdG9vbGtpdC5zbGljZSgxKTtcclxuXHJcbi8vICAgIGxvZyh2YXJzLmFwcCwgYEdldHRpbmcgYWxsIHJlZmVyZW5jZWQgZXh0LSR7b3B0aW9ucy5mcmFtZXdvcmt9IG1vZHVsZXNgKVxyXG4gIHZhciBleHRDb21wb25lbnRzID0gW11cclxuICBjb25zdCBwYWNrYWdlTGliUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBgbm9kZV9tb2R1bGVzL0BzZW5jaGEvZXh0LWFuZ3VsYXItJHt0b29sa2l0fS9saWJgKVxyXG4gIHZhciBmaWxlcyA9IGZzeC5yZWFkZGlyU3luYyhwYWNrYWdlTGliUGF0aClcclxuICBmaWxlcy5mb3JFYWNoKChmaWxlTmFtZSkgPT4ge1xyXG4gICAgLy8gaWYgKGZpbGVOYW1lICYmIGZpbGVOYW1lLnN1YnN0cigwLCA0KSA9PSAnZXh0LScpIHtcclxuICAgIC8vICAgdmFyIGVuZCA9IGZpbGVOYW1lLnN1YnN0cig0KS5pbmRleE9mKCcuY29tcG9uZW50JylcclxuICAgIC8vICAgaWYgKGVuZCA+PSAwKSB7XHJcbiAgICAvLyAgICAgZXh0Q29tcG9uZW50cy5wdXNoKGZpbGVOYW1lLnN1YnN0cmluZyg0LCBlbmQgKyA0KSlcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG5cclxuICAgIGlmIChmaWxlTmFtZSAmJiBmaWxlTmFtZS5zdWJzdHIoMCwgMykgPT0gJ0V4dCcpIHtcclxuICAgICAgdmFyIGVuZCA9IGZpbGVOYW1lLnN1YnN0cigzKS5pbmRleE9mKCcudHMnKTtcclxuICAgICAgaWYgKGVuZCA+PSAwKSB7XHJcbiAgICAgICAgZXh0Q29tcG9uZW50cy5wdXNoKGZpbGVOYW1lLnN1YnN0cmluZygzLCBlbmQgKyAzKS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gIH0pXHJcbiAgbG9nKHZhcnMuYXBwLCBgV3JpdGluZyBhbGwgcmVmZXJlbmNlZCBleHQtJHtvcHRpb25zLmZyYW1ld29ya30gbW9kdWxlc2ApXHJcbiAgcmV0dXJuIGV4dENvbXBvbmVudHNcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF93cml0ZUZpbGVzVG9Qcm9kRm9sZGVyKHZhcnMsIG9wdGlvbnMpIHtcclxuICBjb25zdCBsb2cgPSByZXF1aXJlKCcuL3BsdWdpblV0aWwnKS5sb2dcclxuICBjb25zdCBsb2d2ID0gcmVxdWlyZSgnLi9wbHVnaW5VdGlsJykubG9ndlxyXG4gIGxvZ3Yob3B0aW9ucy52ZXJib3NlLCdGVU5DVElPTiBfd3JpdGVGaWxlc1RvUHJvZEZvbGRlcicpXHJcblxyXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuICBjb25zdCBmc3ggPSByZXF1aXJlKCdmcy1leHRyYScpXHJcblxyXG4gIGNvbnN0IHRvb2xraXQgPSAnbW9kZXJuJztcclxuICBjb25zdCBUb29sa2l0ID0gdG9vbGtpdC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRvb2xraXQuc2xpY2UoMSk7XHJcblxyXG4gIGNvbnN0IHBhY2thZ2VMaWJQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIGBub2RlX21vZHVsZXMvQHNlbmNoYS9leHQtYW5ndWxhci0ke3Rvb2xraXR9L2xpYmApXHJcbiAgY29uc3QgcGF0aFRvRXh0QW5ndWxhclByb2QgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgYHNyYy9hcHAvZXh0LWFuZ3VsYXItJHt0b29sa2l0fS1wcm9kYClcclxuICBjb25zdCBzdHJpbmcgPSAnRXh0LmNyZWF0ZSh7XFxcInh0eXBlXFxcIjpcXFwiJ1xyXG5cclxuICB2YXJzLmRlcHMuZm9yRWFjaChjb2RlID0+IHtcclxuICAgIHZhciBpbmRleCA9IGNvZGUuaW5kZXhPZihzdHJpbmcpXHJcbiAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICBjb2RlID0gY29kZS5zdWJzdHJpbmcoaW5kZXggKyBzdHJpbmcubGVuZ3RoKVxyXG4gICAgICB2YXIgZW5kID0gY29kZS5pbmRleE9mKCdcXFwiJylcclxuICAgICAgdmFycy51c2VkRXh0Q29tcG9uZW50cy5wdXNoKGNvZGUuc3Vic3RyKDAsIGVuZCkpXHJcbiAgICB9XHJcbiAgfSlcclxuICB2YXJzLnVzZWRFeHRDb21wb25lbnRzID0gWy4uLm5ldyBTZXQodmFycy51c2VkRXh0Q29tcG9uZW50cyldXHJcblxyXG4gIHZhciB3cml0ZVRvUGF0aFdyaXR0ZW4gPSBmYWxzZVxyXG4gIHZhciBtb2R1bGVWYXJzID0ge1xyXG4gICAgaW1wb3J0czogJycsXHJcbiAgICBleHBvcnRzOiAnJyxcclxuICAgIGRlY2xhcmF0aW9uczogJydcclxuICB9XHJcbiAgdmFycy51c2VkRXh0Q29tcG9uZW50cy5mb3JFYWNoKHh0eXBlID0+IHtcclxuICAgIHZhciBjYXBjbGFzc25hbWUgPSB4dHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHh0eXBlLnJlcGxhY2UoLy0vZywgXCJfXCIpLnNsaWNlKDEpXHJcbiAgICBtb2R1bGVWYXJzLmltcG9ydHMgPSBtb2R1bGVWYXJzLmltcG9ydHMgKyBgaW1wb3J0IHsgRXh0JHtjYXBjbGFzc25hbWV9Q29tcG9uZW50IH0gZnJvbSAnLi9leHQtJHt4dHlwZX0uY29tcG9uZW50JztcXG5gXHJcbiAgICBtb2R1bGVWYXJzLmV4cG9ydHMgPSBtb2R1bGVWYXJzLmV4cG9ydHMgKyBgICAgIEV4dCR7Y2FwY2xhc3NuYW1lfUNvbXBvbmVudCxcXG5gXHJcbiAgICBtb2R1bGVWYXJzLmRlY2xhcmF0aW9ucyA9IG1vZHVsZVZhcnMuZGVjbGFyYXRpb25zICsgYCAgICBFeHQke2NhcGNsYXNzbmFtZX1Db21wb25lbnQsXFxuYFxyXG4gICAgdmFyIGNsYXNzRmlsZSA9IGBleHQtJHt4dHlwZX0uY29tcG9uZW50LnRzYFxyXG4gICAgY29uc3QgY29udGVudHMgPSBmc3gucmVhZEZpbGVTeW5jKGAke3BhY2thZ2VMaWJQYXRofS8ke2NsYXNzRmlsZX1gKS50b1N0cmluZygpXHJcbiAgICBmc3gud3JpdGVGaWxlU3luYyhgJHtwYXRoVG9FeHRBbmd1bGFyUHJvZH0vJHtjbGFzc0ZpbGV9YCwgY29udGVudHMsICd1dGYtOCcsICgpPT57cmV0dXJufSlcclxuICAgIHdyaXRlVG9QYXRoV3JpdHRlbiA9IHRydWVcclxuICB9KVxyXG4gIGlmICh3cml0ZVRvUGF0aFdyaXR0ZW4pIHtcclxuICAgIHZhciB0ID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKS5leHRBbmd1bGFyTW9kdWxlKFxyXG4gICAgICBtb2R1bGVWYXJzLmltcG9ydHMsIG1vZHVsZVZhcnMuZXhwb3J0cywgbW9kdWxlVmFycy5kZWNsYXJhdGlvbnNcclxuICAgIClcclxuICAgIGZzeC53cml0ZUZpbGVTeW5jKGAke3BhdGhUb0V4dEFuZ3VsYXJQcm9kfS9leHQtYW5ndWxhci0ke3Rvb2xraXR9Lm1vZHVsZS50c2AsIHQsICd1dGYtOCcsICgpPT57cmV0dXJufSlcclxuICB9XHJcblxyXG4gIGNvbnN0IGJhc2VDb250ZW50ID0gZnN4LnJlYWRGaWxlU3luYyhgJHtwYWNrYWdlTGliUGF0aH0vZW5nLWJhc2UudHNgKS50b1N0cmluZygpXHJcbiAgZnN4LndyaXRlRmlsZVN5bmMoYCR7cGF0aFRvRXh0QW5ndWxhclByb2R9L2VuZy1iYXNlLnRzYCwgYmFzZUNvbnRlbnQsICd1dGYtOCcsICgpPT57cmV0dXJufSlcclxufSJdfQ==