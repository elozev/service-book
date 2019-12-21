module.exports = (path, db, app) => {

  const errHandler = (err, res) => {
    console.log(err.cause);
    res.status(err.statusCode).json(err.cause);
  }

  const getMakes = (_, res) => {
    db.auto_databases_one.findAll(
      {
        attributes: [[db.DataTypes.fn('DISTINCT', db.DataTypes.col('make')), 'make']],
        order: [['model', 'ASC']],
      }
    )
      .then(result => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(error => errHandler({ statusCode: 500, cause: error }, res));
  }

  const getModels = (req, res) => {
    const make = req.params.make;
    db.auto_databases_one.findAll(
      {
        where: { make: make },
        attributes: [[db.DataTypes.fn('DISTINCT', db.DataTypes.col('model')), 'model']],
        order: [['model', 'ASC']],
      }
    )
      .then(result => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(error => errHandler({ statusCode: 500, cause: error }, res));
  }

  const getYears = (req, res) => {
    const make = req.params.make;
    const model = req.params.model;

    db.auto_databases_one.findAll(
      {
        where: { make: make, model: model },
        attributes: [[db.DataTypes.fn('DISTINCT', db.DataTypes.col('year')), 'year']],
        order: [['year', 'ASC']],
      }
    )
      .then(result => {
        if (result) {
          return res.status(200).json(result);
        }
      })
      .catch(error => errHandler({ statusCode: 500, cause: error }, res));
  }

  app.get(path, getMakes);
  app.get(path + "/:make/", getModels);
  app.get(path + "/:make/:model", getYears);
}
