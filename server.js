const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'admin',
    database : 'mydb'
  }
});

//console.log(posrgres.select('*').from('users'));

const app = express();

app.use(bodyParser.json());
app.use(cors());

const database = {
	users: [
		{
			id:'123',
			name: 'John',
			email: 'jee@gmail.com',
			password: 'hello',
			entries: 0,
			joined: new Date()
		},
		{
			id:'124',
			name: 'Sally',
			email: 'sally@gmail.com',
			password: 'apple',
			entries: 0,
			joined: new Date()
		}
	]
}

app.get('/', (req, res)=> {
	res.send(database.users);
})

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
  	.where('email', '=', req.body.email)
  	.then(data => {
  	   const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
  	   console.log(isValid);
  	   if (isValid) {
  	   	return db.select('*').from('users')
  	   	  .where('email', '=', req.body.email)
  	   	  .then(user => {
  	   	  	console.log(user);
  	   	  	res.json(user[0])
  	   	  })
  	   	  .catch(err => res.status(400).json('Unable to get users'))
  	   }
  	})
  	.catch(err => res.status(400).json('Wrong Credentials'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync("password");
  db.transaction(trx => {
  	trx.insert({
  		hash: hash,
  		email: email
  	})
  	.into('login')
  	.returning('email')
  	.then(loginEmail => {
  		return db('users')
  		  .returning('*')
  		  .insert({
  		  	email: loginEmail[0],
  		  	name: name,
  		  	joined: new Date()
  		  })
  		  .then(user =>{
  		  	res.json(user[0]);
  		  })
  	})
  	.then(trx.commit)
  	.catch(trx.rollback)
  })
  .catch(err => res.status(400).json('Unabe to Register'))
})	

app.put('/image', (req, res)=>{
	const { id } = req.body;
	db('users').where('id','=', id)
	.increment('entries',1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('Unable to get entries'))
})


app.listen(3000, ()=> {
	console.log('app is running');
})



/*
/sigin --> post = success/fail
/register --> post = user
/profile/:userID --> Get = user
/image --> put --> user


*/