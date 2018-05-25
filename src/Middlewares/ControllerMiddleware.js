const _ = require("lodash");
const { Middleware } = require("@lovejs/components/middlewares");

class ControllerMiddleware extends Middleware {
    constructor(container) {
        super();
        this.container = container;
    }

    getOptionsSchema() {
        return {
            oneOf: [
                { type: "string" },
                {
                    type: "object",
                    properties: {
                        controller: { type: "string" },
                        method: { type: "string" },
                        args: { type: "array" }
                    }
                }
            ]
        };
    }

    normalizeOptions(options) {
        options = super.normalizeOptions(options);

        if (_.isString(options)) {
            options = { controller: options };
        }

        return options;
    }

    mergeOptions(options, inheritOptions) {
        return _.merge(inheritOptions || {}, options);
    }

    getMiddleware({ controller, method, ...args }) {
        return async context => {
            const service = await this.container.get(controller);
            if (!service) {
                throw new Error(`Service for controller "${controller}" not found`);
            }

            if (method && !service[method]) {
                throw new Error(`Method "${method}" not found on controller "${controller}"`);
            }

            const callable = method ? service[method] : service;
            return await callable.apply(service, [context, context.getPathParameters(), args]);
        };
    }
}

module.exports = ControllerMiddleware;
