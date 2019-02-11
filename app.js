//모듈 임포트
const express = require('express');
const path = require('path');
const morgan = require('morgan'); //로그 모듈 임포트
const bodyParser = require('body-parser');

const userRouter = require('./routes/users.js');
const productRouter = require('./routes/products.js');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//미들웨어 설정
app.use(morgan('short')); //로그 미들웨어

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}));

app.use(userRouter);
app.use('/products',productRouter);
//const PORT = process.env.PORT || 3003

//서버 가동
app.listen(3000);