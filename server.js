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

app.get('/books/:id', bookdetails)

app.put('/books/:id/update', bookUpdate)

app.post('/books', saveBooks);





// functionality
function index(req, res){
  client.query('SELECT * FROM books;')
    .then(resultSQL => {
      if(resultSQL.rowCount < 1){
      res.render('pages/searches/new');
    }else{
      client.query('SELECT * FROM books')
        .then( result => {
          res.render('pages/index', {'savedBooks': result.rows});
        })
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
  const sqlQuery = 'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5)'
  const sqlVal = [req.body.title, req.body.author, req.body.isbn, req.body.image, req.body.description];
  client.query(sqlQuery, sqlVal);
  res.render('pages/books/show', {'book': req.body});
}

function bookdetails(req, res){
  console.log('test')
  const sqlQuery = `SELECT * FROM books WHERE id=$1`;
  const sqlVal = [req.params.id];
  console.log(sqlVal, sqlQuery)
  client.query(sqlQuery, sqlVal)
    .then( result => {
      console.log('test')
      res.render('pages/books/show', {'book': result.rows[0]})
    })
    .catch(err => {
      errors(err, res);
    })
}

function bookUpdate(req, res){
  // const sqlQuery = 'SELECT DISTINCT book_shelf FROM books'
  // client.query(sqlQuery)
  //   .then(result => {
  //     res.render('books/:id/update', {'book': })
  //   })
  const sqlQuery = `
    UPDATE books
    SET title=$2, description=$3, image_url=$4, isdn=$5
    WHERE id=$1   
  `;
}

// constructors
function Book (bookFile){
  this.img = bookFile.imageLinks.thumbnail ? bookFile.imageLinks.thumbnail: 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = bookFile.title ? bookFile.title: 'no title found';
  this.author = bookFile.authors ? bookFile.authors[0]: 'no author found';
  this.description = bookFile.description ? bookFile.description: 'no description found';
  this.isbn = bookFile.industryIdentifiers.indentifier ? bookFile.industryIdentifiers.indentifier: 'no isbn';
  this.book_shelf = 'all';
}


app.listen(PORT, console.log(`running on ${PORT}`));