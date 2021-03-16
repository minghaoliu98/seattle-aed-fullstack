

"use strict";

const express = require("express");
const multer = require("multer");
const fs = require('fs').promises;
const cors = require('cors');
const app = express();
const PORT_NUM = 8080;
const ERROR_CODE = 400;
const DEFAULT_IMG = __dirname + "/img/default.jpg";
const FILE_PATH = "/img/";
const { Pool, Client } = require('pg')
const pool = new Pool({
  user: 'postgres',
  host: 'seattle-aed.ceefxyql01pa.us-east-2.rds.amazonaws.com',
  database: 'postgres',
  password: 'Luck2016!',
  port: 5432,
})

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());
app.use(express.static("public"));
app.use(cors({origin: 'null'}));

/**
 * it return a json file that contains all books' title and book id as a get request.
 */
app.get("/api/aed", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    await pool.query('BEGIN TRANSACTION');
    let ex1 = await pool.query('SELECT aed_latitude, aed_longitude, image_approved, aed_location_name, aed_accessibility, aed_location_description, aed_address, id FROM aed');
    await pool.query('COMMIT');
    res.json({"aeds": ex1});
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.get("/api/loc/:lat/:lng", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    await pool.query('BEGIN TRANSACTION');
    const queryText = 'SELECT aed_latitude, aed_longitude, image_approved, aed_location_name, aed_accessibility, \
                            ST_Distance(ST_Transform(ST_SetSRID(ST_Point(aed.aed_longitude, aed.aed_latitude), 4326)::geometry, 32148), ST_Transform(ST_SetSRID(ST_Point($1,$2), 4326)::geometry, 32148)) \
                             as dist FROM aed ORDER BY dist ASC LIMIT 10';
    let closetAED = await pool.query(queryText, [req.params.lng, req.params.lat]);
    await pool.query('COMMIT');
    res.json({"aeds": closetAED});
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.get("/api/aed/:id", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    await pool.query('BEGIN TRANSACTION');
    const queryText = 'SELECT path FROM image where aed_id = $1 ORDER BY rank DESC LIMIT 1';
    let picPath = await pool.query(queryText, [req.params.id]);
    await pool.query('COMMIT');
    if (picPath.rowCount != 0) {
      //   /var/app/current/img/1.jpg
      res.sendFile(__dirname + picPath.rows[0].path);
    } else {
      //  /var/app/current/img/default.jpg
      res.sendFile(DEFAULT_IMG);
    }
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

/**
 * return the picture with id
 */
app.get("/api/pic/:id", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    await pool.query('BEGIN TRANSACTION');
    const queryText = 'SELECT path FROM image where img_id = $1 ORDER BY rank DESC LIMIT 1';
    let picPath = await pool.query(queryText, [req.params.id]);
    await pool.query('COMMIT');
    if (picPath.rowCount != 0) {
      //   /var/app/current/img/1.jpg
      res.sendFile(__dirname + picPath.rows[0].path);
    } else {
      //  /var/app/current/img/default.jpg
      res.sendFile(DEFAULT_IMG);
    }
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.post("/api/login", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let password = req.body.password;
    let user = req.body.email;
    await pool.query('BEGIN TRANSACTION');
    const queryText = 'SELECT * FROM user_info where user_email = $1 AND user_password = $2';
    let login = await pool.query(queryText, [user, password]);
    await pool.query('COMMIT');
    if (login.rowCount != 1) {
      res.json({"name": null, "status": false, "info": "login fail, incorrect username or password"});
    } else {
      res.json({"name": user, "status": true, "info": "Login Successed"});
    }
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.post("/api/change-password", async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    let confirmPassword = req.body.confirmPassword;
    let user = req.body.email;
    if (newPassword !== confirmPassword) {
      res.json({"name": null, "status": false, "info": "login fail, password doesn't match"});
    } else if (newPassword.length <= 5) {
      res.json({"name": null, "status": false, "info": "password is too short, below 6 chars"});
    } else if (newPassword.length > 20) {
      res.json({"name": null, "status": false, "info": "password is too long, exceed 20 chars"});
    } else {
      await pool.query('BEGIN TRANSACTION');
      console.log("s1");
      const queryText = 'SELECT * FROM user_info where user_email = $1 and user_password = $2';
      let userNameCheck = await pool.query(queryText, [user, oldPassword]);
      console.log("s2");
      if (userNameCheck.rowCount != 1) {
        await pool.query('COMMIT');
        res.json({"name": null, "status": false, "info": "Change User Password Fail, wrong password"});
      } else {
        const changePassword = 'UPDATE user_info SET user_password = $2 WHERE user_email = $1';
        await pool.query(changePassword, [user, newPassword]);
        await pool.query('COMMIT');
        res.json({"name": user, "status": true, "info": "User Password Has Changed"});
      }
    }
  } catch (err) {
    await pool.query('ROLLBACK');
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.post("/api/user-upload", async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let user_email = req.body.email;
    if (user_email === "") {
      res.json({"status": false, "info": "Missing User Email"});
    } else {
      await pool.query('BEGIN TRANSACTION');
      const queryText = 'SELECT img_id, upload_date, rank, description FROM image WHERE user_email = $1 ORDER BY upload_date DESC';
      let user_img = await pool.query(queryText, [user_email]);
      await pool.query('COMMIT');
      res.json({"img":user_img});
    }
  } catch (err) {
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.post("/api/registor", async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let user = req.body.email;
    if (password !== confirmPassword) {
      res.json({"name": null, "status": false, "info": "login fail, password doesn't match"});
    } else if (password.length <= 5) {
      res.json({"name": null, "status": false, "info": "password is too short, below 6 chars"});
    } else if (password.length > 20) {
      res.json({"name": null, "status": false, "info": "password is too long, exceed 20 chars"});
    } else {
      await pool.query('BEGIN TRANSACTION');
      const queryText = 'SELECT * FROM user_info where user_email = $1';
      let userNameCheck = await pool.query(queryText, [user]);
      if (userNameCheck.rowCount != 0) {
        await pool.query('COMMIT');
        res.json({"name": null, "status": false, "info": "Create Account Fail, username has been taken"});
      } else {
        const createAccount = 'INSERT INTO user_info(user_email, user_password) VALUES ($1, $2)';
        await pool.query(createAccount, [user, password]);
        await pool.query('COMMIT');
        res.json({"name": user, "status": true, "info": "Account Created"});
      }
    }
  } catch (err) {
    await pool.query('ROLLBACK');
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});

app.post("/api/upload", async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let user_email = req.body.email;
    let aed_id = parseInt(req.body.aed_id);
    let description = req.body.description;
    let image = req.body.image;
    if (user_email === "") {
      res.json({"status": false, "info": "Missing User Email"});
    } else if (aed_id === "") {
      res.json({"status": false, "info": "Missing User AED ID"});
    } else if (image === "") {
      res.json({"status": false, "info": "Missing Picture"});
    } else {
      await pool.query('BEGIN TRANSACTION');
      let image_id_check = await pool.query('SELECT COUNT(*) as number_item FROM image');
      let image_id = parseInt(image_id_check.rows[0].number_item) + 1;
      let data = image.replace(/^data:image\/\w+;base64,/, "");
      let buf = Buffer.from(data, 'base64');
      let relativePath = FILE_PATH + image_id + ".jpg";
      await fs.writeFile(__dirname + relativePath , buf);
      const uploadImage = 'INSERT INTO image(img_id, aed_id, user_email, upload_date, rank, path, description) VALUES ($1, $2, $3, current_timestamp, -1, $4, $5)';
      await pool.query(uploadImage, [image_id, aed_id, user_email, relativePath, description]);
      await pool.query('COMMIT');
      res.json({"img_id": image_id, "status": true, "info": "Image Uploaded"});
    }
  } catch (err) {
    console.log(err + "  hi");
    res.type('text');
    res.status(ERROR_CODE).send("Something went wrong on the server: " + err);
  }
});



const PORT = process.env.port || PORT_NUM;
app.listen(PORT);
