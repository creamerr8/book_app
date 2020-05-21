'use strict'


// packages
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg')


// globals
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static('./public'));
const books = [];

// config
app.use(cors());
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL)
client.on('error', error => console.error(error));
client.connect();

app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');


// routes
app.get('/', index);

app.get('/searches/new', searches);

app.post('/searches', getBooks);

app.get('/books:id', bookdetails)

app.post('/books', saveBooks);



// functionality
function index(req, res){

  //DONE: check data basse if there are any books
  // DONE: logic check: if nothing in data base send to search for new book
  //TODO: if is something send from database

  client.query('SELECT * FROM books;')
    .then(resultSQL => {
      if(resultSQL.rowCount < 1){
      res.render('pages/searches/new');
    }else{
      // const sqlQuery = 'SELECT * FROM books'
      res.render('pages/index', {savedBooks: books});
    }
  })
}

function searches(req, res) {
   res.render('pages/searches/new');
}

function errors (err, res) {
  console.log(err);
  res.render('pages/error', {error: err});
}

function getBooks(req, res){
  let url;
  req.body['search-type'] === 'author' ? url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.search}` : url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.search}`;
  superagent.get(url)
    .then(resultBooks => {
      const bookMap =resultBooks.body.items.map(bookFile => new Book(bookFile.volumeInfo));
      res.render('pages/searches/show', {newBooks: bookMap});
    })
    .catch(error => {
      res.send(error).status(500);
      console.log(error);
    });
}

function saveBooks(req, res){
  console.log(req.body);
  const sqlQuery = 'INSERT INTO books (title, image_url, author, description, isbn) VALUES ($1, $2, $3, $4, $5)'
  const sqlVal = [req.body.title, req.body.author, req.body.img, req.body.description, req.body.isbn];
  client.query(sqlQuery, sqlVal);
  res.render('pages/books/show', {'book': req.body});
  books.push(req.body);
}

function bookdetails(req, res){
  const sqlQuery = `SELECT * FROM books WHERE title = '${req.params.id}'`;
  client.query(sqlQuery)
    .then( result => {
      res.render('pages/books/show', {newBooks: result.row})
    })
    .catch(err => {
      errors(err, res);
    })
}

// constructors
function Book (bookFile){
  this.img = bookFile.imageLinks.thumbnail ? bookFile.imageLinks.thumbnail: 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = bookFile.title ? bookFile.title: 'no title found';
  this.author = bookFile.authors ? bookFile.authors[0]: 'no author found';
  this.description = bookFile.description ? bookFile.description: 'no description found';
  this.isbn = bookFile.isbn;
}


app.listen(PORT, console.log(`running on ${PORT}`));