import Launcher from 'webdriverio/build/lib/launcher';
import staticServer from 'node-static';
import enableDestroy from 'server-destroy';
import http from 'http';

function startTestHttpServer() {
  const fileServer = new staticServer.Server('./test/fixtures/');

  const server = http.createServer((request, response) => {
    request.addListener('end', () => {
      fileServer.serve(request, response);
    }).resume();
  });
  server.listen(54392);
  enableDestroy(server);
  return server;
}

function stopTestHttpServer(server) {
  server.destroy();
}

function run(specs, wdioConfigPath) {
  const testHttpServer = startTestHttpServer();
  //  disableOutput()
  const launcher = new Launcher(wdioConfigPath, {
    specs,
  });

  return launcher.run().then(() => {
    //        enableOutput()
    stopTestHttpServer(testHttpServer);
  });
}

export function runMocha (specs, wdioConfigPath) {
  const features = specs.map(spec => `./testWip/fixtures/specs/${spec}.js`)
  const path = wdioConfigPath || './testWip/fixtures/wdio.conf/wdio.conf.mocha.js'

  return run(features, path)
}

export function runCucumber(specs, wdioConfigPath) {
  const features = specs.map(feature => `./testWip/fixtures/features/${feature}.feature`);
  const configPath = wdioConfigPath || './testWip/fixtures/wdio.conf/wdio.conf.js';

  return run(features, configPath);
}


