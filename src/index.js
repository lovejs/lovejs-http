const path = require("path");
const { Plugin } = require("@lovejs/framework");
const {
    di: {
        Definitions: { Arguments, Call, Factory, Service, Tag },
        helpers: { _service }
    }
} = require("@lovejs/components");

class HttpPlugin extends Plugin {
    async registerServices(container, origin) {
        await container.loadDefinitions(this.getPluginDir("/_framework/services/services.yml"), origin);
        
        const servers = this.get("servers");
        for (let name in servers) {
            const configuration = servers[name];
            let { factory, handler, uws } = configuration;

            const service = new Service(new Factory(factory, "getServer"), { public: true });
            const serviceName = `http.server.${name}`;
            service.setArgs([_service(handler), { uws }]);
            service.addTag(new Tag("http.server", { configuration }));
            container.setService(serviceName, service);

            if (name === "default") {
                container.setServiceAlias("http.server", "http.server.default");
            }
        }

        const koaMiddlewares = this.get("koa_middlewares", {});
        for (let name in koaMiddlewares) {
            const service = new Service(this.getPluginDir("/Middlewares/KoaMiddlewares"), { public: true });
            const serviceName = `http.middleware.${name}`;
            service.setArgs([koaMiddlewares[name]]);
            service.addTag(new Tag("http.middleware", { name }));
            container.setService(serviceName, service);
        }

        if (this.hasPlugin('cupidon')) {
            await container.loadDefinitions(this.getPluginDir("/_framework/services/cupidon.yml"), origin);
        }
    }

    async boot(container, logger, isCli) {
        if (isCli) {
            return;
        }

        const servers = this.get("servers");
        for (let name in servers) {
            const configuration = servers[name];
            const { listen } = configuration;
            const server = await container.get(`http.server.${name}`);
            try {
                await this.startServer(server, listen);
                logger.info(`HTTP Server ${name} listening on ${JSON.stringify(listen)}`);
            } catch (error) {
                logger.error(`HTTP Server ${name} failed to start on ${JSON.stringify(listen)} : ${error.message}`);
            }
        }
    }

    async startServer(server, options) {
        return new Promise((resolve, reject) => {
            try {
                let args = [options.port];
                if (options.host) {
                    args.push(options.host);
                }
                args.push(() => resolve(true));
                server.listen(...args);
            } catch (error) {
                reject(error);
            }
        });
    }

    async halt(container, logger, isCli) {
        const servers = this.get("servers");
        for (let name in servers) {
            try {
                const server = await container.get(`http.server.${name}`);
                await this.stopServer(server);
            } catch (error) {}
        }
    }

    async stopServer(server) {
        return new Promise((resolve, reject) => server.destroy(error => (error ? reject(error) : resolve(true))));
    }
}

module.exports = HttpPlugin;
