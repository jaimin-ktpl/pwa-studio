if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}
const validEnv = require('./validate-environment')(process.env);
const {
    Utilities: { addImgOptMiddleware }
} = require('@magento/pwa-buildpack');
const {
    bestPractices,
    createUpwardServer,
    envToConfig
} = require('@magento/upward-js');

async function serve() {
    const config = Object.assign(
        {
            bindLocal: true,
            logUrl: true
        },
        envToConfig(validEnv),
        {
            env: validEnv,
            before: app => {
                addImgOptMiddleware(app, validEnv);
                app.use(bestPractices());
            }
        }
    );

    if (validEnv.isProduction) {
        if (process.env.PORT) {
            console.log(
                `NODE_ENV=production and PORT set. Binding to localhost:${
                    process.env.PORT
                }`
            );
            config.port = process.env.PORT;
        } else {
            console.log(
                `NODE_ENV=production and no PORT set. Binding to localhost with random port`
            );
            config.port = 0;
        }
        await createUpwardServer(config);
        console.log(`UPWARD Server listening in production mode.`);
        return;
    }

    if (!config.host) {
        try {
            const {
                Utilities: { configureHost }
            } = require('@magento/pwa-buildpack');
            const { hostname, ports, ssl } = await configureHost({
                interactive: false,
                subdomain: validEnv.MAGENTO_BUILDPACK_SECURE_HOST_SUBDOMAIN,
                exactDomain:
                    validEnv.MAGENTO_BUILDPACK_SECURE_HOST_EXACT_DOMAIN,
                addUniqueHash:
                    validEnv.MAGENTO_BUILDPACK_SECURE_HOST_ADD_UNIQUE_HASH
            });
            config.host = hostname;
            config.https = ssl;
            config.port = ports.staging;
        } catch (e) {
            console.log(
                'Could not configure or access custom host. Using loopback...'
            );
        }
    }

    await createUpwardServer(config);
    if (config.logUrl) {
        console.log('\nStaging server running at the address above.\n');
    } else {
        console.log('\nUPWARD server listening in staging mode.\n');
    }
}

console.log('Launching staging server...\n');
const appStarted = serve();

// This part is for now.sh version 2 and other serverless deployments.
// A lambda probably won't execute against more than one request, but juuuuust
// in case it does, let's cache the server startup procedure.
let app;

module.exports = async (req, res) => {
    app = app || (await appStarted);
    app(req, res);
};
