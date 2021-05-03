var checkToken = require('./middleware').checkToken;
const async = require('async');

// path = api/v1/car

module.exports = (path, db, app) => {
    /**
     * Create a service record
     *
     * @param {*} req
     * @param {*} res
     */
    const createService = (req, res) => {
        if (!req.body) return res.status(412).json({ message: 'Празно body' });
        if (!req.body.kilometers) return res.status(412).json({ message: 'Километрите са задължително' });
        if (!req.body.products) return res.status(412).json({ message: 'Поне един продукт трябва да присъства в обслужването!' });
        if (req.body.products.length === 0)
            return res.status(412).json({ message: 'Поне един продукт трябва да присъства в обслужването!' });

        async.waterfall(
            [
                // Check if the license plate exists
                done => {
                    db.clientCars
                        .findOne({ where: { license_plate: req.params.license_plate } })
                        .then(dbResult => {
                            if (dbResult === null) {
                                return done({
                                    statusCode: 404,
                                    cause: { isError: true, message: 'Не бе намерен автомобил с такъв регистрационен номер!' },
                                });
                            }
                            done(null, dbResult);
                        })
                        .catch(err => {
                            return done({ statusCode: 500, cause: err });
                        });
                },

                // Create the service record itself
                (car, cb) => {
                    db.services
                        .create(req.body)
                        .then(service => {
                            car.addService(service);
                            // TODO: remove res.status(200).json(service);
                            cb(null, service);
                        })
                        .catch(dbErr => {
                            console.log(dbErr);
                            return cb({ statusCode: 503, cause: dbErr });
                        });
                },

                // Create product by product
                (service, callback) => {
                    createProductsFromList(req.body.products, service).then(() => {
                        callback(null, service);
                    });
                },

                (service, cb) => {
                    db.services
                        .findOne({
                            where: { id: service.id },
                            include: [db.products],
                        })
                        .then(serviceProducts => {
                            return res.status(200).json(serviceProducts);
                        })
                        .catch(err => {
                            console.log(err);
                            return cb({ statusCode: 503, cause: err });
                        });
                },
            ],
            function(err) {
                if (err) {
                    return res.status(err.statusCode).json(err.cause);
                }
                res.end();
            },
        );
    };

    /**
     * Create in the db all the product records
     *
     * @param {list of products} products
     */
    var createProductsFromList = function(products, service) {
        return products.reduce((promise, product) => {
            return promise.then(() => {
                // create the product
                const findQuery =
                    product.type === 'oil'
                        ? { type: product.type, code: product.code, brand: product.brand }
                        : { type: product.type, code: product.code };

                db.products
                    .findOrCreate({
                        where: findQuery,
                        defaults: { type: product.type, code: product.code, brand: product.brand },
                    })
                    .then(([dbProduct, isCreated]) => {
                        if (dbProduct === null) {
                            console.log({ message: 'Един от продуктите не можа да бъде създаден!' });
                        }
                        // Add service to the product
                        if (isCreated) {
                            dbProduct.addService(service).then(() => addFluidAmount(product, service, dbProduct));
                        } else {
                            dbProduct.getServices().then(services => {
                                services.push(service);
                                dbProduct.setServices(services).then(() => addFluidAmount(product, service, dbProduct));
                            });
                        }
                    });
            });
        }, Promise.resolve());
    };

    /**
     * Adds fluid amount to *.* relation between product and service
     * @param {*} product
     * @param {*} service
     * @param {*} dbProduct
     */
    const addFluidAmount = (product, service, dbProduct) => {
        if (product.fluid_amount !== null && typeof product.fluid_amount !== 'undefined') {
            db.serviceProducts
                .findOne({
                    where: { service_id: service.id, product_id: dbProduct.id },
                })
                .then(serviceProduct => {
                    if (serviceProduct) {
                        // Add fluid_amount to the product
                        serviceProduct
                            .update({
                                fluid_amount: parseFloat(product.fluid_amount),
                            })
                            .then(newServiceProduct => {
                                console.log(newServiceProduct);
                            });
                    }
                });
        }
    };

    /**
     * Get all the services from specific range
     * @param {*} req
     * @param {*} res
     */
    const getAllServicesFromToday = (req, res) => {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        db.services
            .findAll({
                where: {
                    date: {
                        [db.DataTypes.Op.between]: [startDate, endDate],
                    },
                },
                include: [
                    { model: db.products, as: 'products' },
                    { model: db.clientCars, as: 'clientCar', include: [{ model: db.internalCars, as: 'internalCar' }] },
                ],
            })
            .then(services => {
                return res.status(200).json(services);
            })
            .catch(e => {
                console.log(e);
                return res.status(500).json(e);
            });
    };

    /**
     * Get all the services from specific range
     * @param {*} req
     * @param {*} res
     */
    const getServicesForACar = (req, res) => {
        const lp = req.params.license_plate;

        db.services
            .findAll({
                include: [
                    { model: db.products, as: 'products' },
                    {
                        model: db.clientCars,
                        as: 'clientCar',
                        where: { license_plate: lp },
                        include: [{ model: db.internalCars, as: 'internalCar' }],
                    },
                ],
            })
            .then(services => {
                return res.status(200).json(services);
            })
            .catch(e => {
                console.log(e);
                return res.status(500).json(e);
            });
    };

    const updateServiceById = (req, res) => {
        const serviceId = req.params.serviceId;

        const updateBody = req.body;
        const products = updateBody.products;

        db.services
            .findByPk(serviceId, {
                include: [{ model: db.products, as: 'products' }],
            })
            .then(service => {
                if (service) {
                    updateBody.products = [];
                    service.update(updateBody);

                    service.save();

                    return createProductsFromList(products, service).then(() => {
                        return res.status(200).json({ message: 'ok' });
                    });

                    // return res.status(200).json(service);
                }
                return res.status(500).json({ message: 'Проблем с обслужването' });
            })
            .catch(e => {
                console.log(e);
                return res.status(500).json(e);
            });
    };

    app.post(path + '/:license_plate/service', checkToken, createService);
    app.get(path + '/:license_plate/service', getServicesForACar);
    app.get(path + '/service', getAllServicesFromToday);

    app.put(path + '/service/:serviceId', updateServiceById);

    // TODO: for testing purposes
    app.get(path + '/service/:id', (req, res) => {
        db.services
            .findOne({
                where: { id: req.params.id },
                include: [db.products],
            })
            .then(serviceProducts => {
                return res.status(200).json(serviceProducts);
            });
        // .catch(err =)
    });
};
