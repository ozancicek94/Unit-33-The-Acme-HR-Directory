// import the packages ---------------------------------

const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_hr_directory_db');
const app = express();

// parse the incoming requests from JSON ----------------

app.use(express.json());

// log the requests -------------------------------------

app.use(require('morgan')('dev'));

// app routes here --------------------------------------

app.post('/api/employees', async(req,res,next) => {
  try{

    const SQL = `INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *`;

    const response = await client.query(SQL, [req.body.name, req.body.department_id]);

    res.send(response.rows[0]);

  } catch(error){next(error)}
});

app.get('/api/employees', async(req,res,next) => {
  try{

    const SQL = `SELECT * FROM employees ORDER BY created_at DESC`;

    const response = await client.query(SQL);

    res.send(response.rows);

  } catch(error){next(error)}
});

app.get('/api/departments', async(req,res,next) => {
  try{

    const SQL = `SELECT * FROM departments`;

    const response = await client.query(SQL);

    res.send(response.rows);

  } catch(error){next(error)}
});

app.put('/api/employees/:id', async(req,res,next) => {
  try{

    const SQL = `
    UPDATE employees
    SET name=$1, department_id=$2, updated_at=now()
    WHERE id=$3 RETURNING *
    `;

    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id]);

    res.send(response.rows[0]);

  } catch(error){next(error)}
});

app.delete('/api/employees/:id', async(req,res,next) => {
  try{

    const SQL = `
    DELETE from employees
    WHERE id=$1
    `;

    const response = await client.query(SQL, [req.params.id]);

    res.send(response.rows[0]);

  } catch(error){next(error)}
});



// create the init() function here ----------------------

const init = async() => {

  await client.connect();
  console.log("Successfully connected to the database");

  let SQL = `

  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;

  CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
  );

  CREATE TABLE employees(
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  department_id INTEGER REFERENCES departments(id) NOT NULL
  );
  `;

  await client.query(SQL);
  console.log("Tables are created");

  SQL = `
  
  INSERT INTO departments (name) VALUES ('Buildings');
  INSERT INTO departments (name) VALUES ('Wilding');
  INSERT INTO departments (name) VALUES ('Strategy');

  INSERT INTO employees (name, department_id) VALUES ('Ozan Cicek', (SELECT id FROM departments WHERE name='Buildings'));
  INSERT INTO employees (name, department_id) VALUES ('Jasper Flores', (SELECT id FROM departments WHERE name='Wilding'));
  INSERT INTO employees (name, department_id) VALUES ('Jeffrey Lee', (SELECT id FROM departments WHERE name='Buildings'));
  INSERT INTO employees (name, department_id) VALUES ('AJ Abdulaziz', (SELECT id FROM departments WHERE name='Strategy'));
  INSERT INTO employees (name, department_id) VALUES ('Fern Springtanokul', (SELECT id FROM departments WHERE name='Buildings'));
  INSERT INTO employees (name, department_id) VALUES ('Michelle Benoit', (SELECT id FROM departments WHERE name='Wilding'));
  `;

  await client.query(SQL);
  console.log("Data is seeded");

  const port = process.env.PORT || 3000;

  app.listen(port, () => {console.log(`Listening on port ${port} `)});

}

// call the init function--------------------------------

init();

