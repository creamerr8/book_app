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
app.get('/', index)

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new')
});
app.post('/searches', getBooks)



// functionality
function index(req, res){

  // check data basse if there are any books
  // logic check: if nothing in data base send to search for new book
  // if is something send from database

  client.query('SELECT * FROM books;')
    .then(resultSQL => {
      if(resultSQL.rowCount < 1){
      res.render('pages/searches/new');
    }else{
      res.render('pages/index');
    }
  })
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



// constructors
function Book (bookFile){
  this.img = bookFile.imageLinks.thumbnail ? bookFile.imageLinks.thumbnail: 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = bookFile.title ? bookFile.title: 'no title found';
  this.author = bookFile.authors ? bookFile.authors[0]: 'no author found';
  this.description = bookFile.description ? bookFile.book_desc: 'no description found';
}


app.listen(PORT, console.log(`running on ${PORT}`));