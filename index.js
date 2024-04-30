const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_flavors_32"
);
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

// READ - returns array of flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// READ - returns a single flavor
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const flavorID = req.params.id;
    const SQL = `SELECT * FROM flavors WHERE id = $1`;
    const response = await client.query(SQL, [flavorID]);
    if (response.rows.length === 0) {
      return res.status(404).send({ error: "Flavor not found" });
    }
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// CREATE - payload: the flavor to create, returns the created flavor
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        INSERT INTO flavors(name, is_favorite)
        VALUES($1, $2)
        RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// UPDATE - payload: the updated flavor, returns the updated flavor
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
          UPDATE flavors
          SET name=$1, is_favorite=$2, updated_at=now()
          WHERE id=$3
          RETURNING *
          `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE - returns nothing
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          DELETE from flavors
          WHERE id=$1
          `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");

  let SQL = /* sql */ `
  DROP TABLE IF EXISTS flavors;
  CREATE TABLE flavors (
    id SERIAL PRIMARY KEY, 
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    name VARCHAR(255) NOT NULL,
    is_favorite BOOLEAN DEFAULT false --
  )
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql */ ` 
  INSERT INTO flavors(name, is_favorite) 
  VALUES
    ('Vanilla', true),
    ('Strawberry', false),
    ('Chocolate', false),
    ('Neapolitan', true),
    ('Cookies n Cream', true),
    ('Coffee', true)
  `;

  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
