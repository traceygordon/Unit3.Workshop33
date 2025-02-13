const express = require("express");
const pg = require("pg");

const app = express();

app.use(express.json());

const client = new pg.Client(
  "postgres://postgres:2182@localhost:5432/acme_hr_db"
);

app.get("/api/employees", async (req, res, next) => {
  try {
    const response = await client.query(`
            SELECT * FROM employees
            `);
    res.send(response.rows);
  } catch (ex) {
    next();
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const response = await client.query(`
                SELECT * FROM departments
                `);
    res.send(response.rows);
  } catch (ex) {
    next();
  }
});

app.post("/api/employees", async (req, res, next) => {

    
    try {
      const response = await client.query(
        `
          INSERT INTO employees (name, department_id)
          VALUES ($1, (SELECT id FROM departments WHERE name=$2))
          RETURNING *
          `,
        [req.body.name, req.body.department]
      );
  
      res.send(response.rows[0]);
    } catch (ex) {
      next(ex);
    }
  });

  app.delete("/api/employees/:id", async (req, res, next) => {
    const { id } = req.params;
    try {
      const response = await client.query(
        `
           DELETE FROM employees WHERE id=$1;
          `,
        [id]
      );
  
      res.send(response.rows);
    } catch (ex) {
      next();
    }
  });

  app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `
      const response = await client.query(SQL, [
        req.body.name,
        req.body.department_id,
        req.params.id
      ])
      res.send(response.rows[0])
    } catch (ex) {
      next(ex)
    }
  })

const init = async () => {
  await client.connect();
  const SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
    
    id SERIAL PRIMARY KEY,
    name VARCHAR(50));

    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL);

    INSERT INTO departments(name) 
    VALUES('accounting'), ('creative'), ('it'), ('hr');
    INSERT INTO employees(name, department_id) 
    VALUES
    ('Donna', (SELECT id FROM departments WHERE name='accounting')), ('Alister', (SELECT id FROM departments WHERE name='creative')),
    ('Tracey', (SELECT id FROM departments WHERE name='it')),
    ('Henry Russell', (SELECT id FROM departments WHERE name='hr'));
    `;

  await client.query(SQL);
  app.listen(3000, () => console.log("listening on port 3000"));
};

init();
