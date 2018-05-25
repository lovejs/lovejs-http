const path = require("path");
const _ = require("lodash");
const shortid = require("shortid");
const { errorToJSON } = require("json-error");
const CupidonExtension = require("@lovejs/cupidon/src/Cupidon/CupidonExtension");

class CupidonHttp extends CupidonExtension {
    constructor(container, projectDir) {
        super();
        this.contexts = [];
        this.backlogSize = 1000;
        this.container = container;
        this.projectDir = projectDir;
    }

    getTitle() {
        return "HTTP";
    }

    getIcon() {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M480 160H32c-17.673 0-32-14.327-32-32V64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24z"/></svg>`;
    }

    getComponent() {
        return __dirname + "/../_framework/cupidon/extensions/CupidonHttp.js";
    }

    getMiddlewares() {
        return _.sortBy(
            this.container.getServicesTags("http.middleware").map(({ id, service, tag }) => ({
                name: tag.data.name,
                service: id,
                module: service.getModule() ? path.relative(this.projectDir, service.getModule()) : ""
            })),
            "name"
        );
    }

    async getServers() {
        return this.container.getServicesTags("http.server").map(({ id, service, tag }) => {
            let { configuration: { factory, handler, uws, listen } } = tag.getData();

            return {
                service: id,
                factory,
                handler,
                uws,
                listen
            }
        });
    }

    async getDataInitial() {
        const middlewares = [];
        for (let { id, service, tag } of this.container.getServicesTags("http.middleware")) {
            middlewares.push({
                name: tag.data.name,
                service: id,
                module: service.getModule()
            });
        }

        return {
            contexts: this.contexts,
            middlewares: this.getMiddlewares(),
            servers: await this.getServers()
        };
    }

    async getDataContext(context) {
        return { id: context };
    }

    async getData(query, { context }) {
        switch (query) {
            case "initial":
                return await this.getDataInitial();
                break;
            case "context":
                return await this.getDataContext(context);
                break;
        }
    }

    serializeContext(context, error, data = {}) {
        if (!context.getAttribute("_cupidon_id")) {
            context.setAttribute("_cupidon_id", shortid.generate());
        }

        return {
            id: context.getAttribute("_cupidon_id"),
            path: context.path,
            method: context.method,
            status: context.status,
            time: context.response.get("X-Response-Time") || null,
            attributes: context.getAttributes(),
            error: error ? errorToJSON(error) : null,
            ...data
        };
    }

    addContext(context) {
        const idx = _.findIndex(this.contexts, { id: context.id });
        if (idx != -1) {
            this.contexts[idx] = context;
        } else {
            this.contexts.unshift(context);
            this.contexts = this.contexts.slice(0, this.backlogSize);
        }
    }

    handleContextStart({ data: { context } }) {
        const data = this.serializeContext(context);
        this.addContext(data);
        this.emit(data);
    }

    handleContextEnd({ data: { context, error } }) {
        const data = this.serializeContext(context, error);
        this.addContext(data);
        this.emit(data);
    }
}

module.exports = CupidonHttp;