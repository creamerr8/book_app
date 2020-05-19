'use strict'

const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();
const superagent = require('superagent');

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');




app.get('/hello', (req, res) => {
  res.render('pages/index');
})

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new')
});
app.post('/searches', getBooks)



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




function Book (bookFile){
  this.img = bookFile.img ? bookFile.img: 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = bookFile.title ? bookFile.title: 'no title found';
  this.author = bookFile.author ? bookFile.author[0]: 'no author found';
  this.description = bookFile.description ? bookFile.book_desc: 'no description found';
}


app.listen(PORT, console.log(`running on ${PORT}`));