const validEnv = require('./validate-environment')(process.env);
const addImgOptMiddleware = require('@magento/pwa-buildpack/dist/Utilities/addImgOptMiddleware');
const {
    bestPractices,
    createUpwardServer,
    envToConfig
} = require('@magento/upward-js');

async function serve() {
    const config = Object.assign({}, envToConfig(validEnv), {
        env: validEnv,
        before: app => {
            addImgOptMiddleware(app, validEnv);
            app.use(bestPractices());
        },
        bindLocal: false,
        logUrl: false
    });

    const server = await createUpwardServer(config);
    return server;
}

console.log('[VENIA] Launching staging server...\n');
const appStarted = serve();

// This part is for now.sh version 2 and other serverless deployments.
// A lambda probably won't execute against more than one request, but juuuuust
// in case it does, let's cache the server startup procedure.
let app;
let calls = 0;

module.exports = async (req, res) => {
    if (!app) {
        console.log('[VENIA] Awaiting staging server...');
        app = await appStarted;
    } else {
        console.log(
            `[VENIA] Reusing existing staging server (this lambda handled ${++calls} calls)`
        );
    }
    app(req, res);
};
