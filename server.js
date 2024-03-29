const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');
const cors = require('cors')

const mongoose = require('mongoose', {useNewUrlParser: true})

process.env.MONGO_URI = 'mongodb+srv://zgleman:grey1127@cluster0-2my3z.mongodb.net/test?retryWrites=true&w=majority';
mongoose.connect(process.env.MONGO_URI);
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const User = mongoose.model('User', { _id: {
                                            'type': String,
                                            'default': shortid.generate}, 
                                     name: String,
                                     exercise:[]});

app.post('/api/exercise/new-user', function(req, res){
  User.count({name: req.body.username}, function(err, count){
    if (err) return (err);
    if (count == 0) {
      var newUser = new User({ name: req.body.username });        
      newUser.save(function(err){
         if (err) return (err);
      });
      res.json({newUser});
      } else if (count >= 1) {
      res.json({error: "Username already taken"});
    }}
  )}); 

app.get('/api/exercise/users', function(req, res){
  User.find({}, function(err, data){
    if (err) return (err);
    console.log(data);
    res.send(data);
  }); 
});
  
app.post('/api/exercise/add', function(req, res){
  User.findById(req.body.userId, function(err, data){
    if (err) return "Error updating user";
    var newExercise = {Description: req.body.description, Duration: req.body.duration, Date: (req.body.date == "" ? new Date: new Date(req.body.date))};
    data.exercise.push(newExercise);
    data.save();
    res.json({data});
  });
});

app.get('/api/exercise/log?', function(req, res){
  User.findById(req.query.userId, function(err, data){
    if (err) return (err);
    if (data == null) {
      res.json({error: "User not found"});
    } else {
      console.log(req.query.from, req.query.to, req.query.limit)
      console.log(typeof req.query.from, typeof req.query.to, typeof req.query.limit)
      console.log(typeof req.query.from !== undefined, typeof req.query.to !== undefined, typeof req.query.limit !== undefined)
      var log = data.exercise;
      req.query.from !== undefined ? log = log.filter((d)=> d.Date >= new Date(req.query.from)): null;
      req.query.to !== undefined ? log = log.filter((d)=> d.Date <= new Date(req.query.to)): null;
      req.query.limit !== undefined ? log = log.slice(0, req.query.limit): null;
      res.json({name: data.name, exercise: log})
    }
  });
});
  
app.get('/api/exercise/deleteAllUsers', function(req, res){
  User.deleteMany({}, function(err){
    if (err) return (err);
  })
});








// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
