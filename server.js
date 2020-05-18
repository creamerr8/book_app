'use strict'

const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();

app.listen(PORT, console.log(`running on ${PORT}`));

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.get('/hello', (req, res) => {
  res.render('index.ejs');
})


app.set('view engine', 'ejs');

