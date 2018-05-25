const _ = require("lodash");
const enableDestroy = require("server-destroy");

const {
    http: { Request, Response }
} = require("@lovejs/components");

class HttpServerFactory {
    getServer(handler, { uws }) {
        const type = uws ? require("uws").http : require("http");
        const server = type.createServer(handler.getHandler());
        enableDestroy(server);

        return server;
    }
}

module.exports = HttpServerFactory;
