require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const winston = require('winston');
const morgan = require('morgan');
const port = 6060;

// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'HEE_RAMI_API',
      version: '1.0.0',
      description: 'HEE_RAMI_API_DESCRIPTION',
    },
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'headers',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  apis: ['./routes/*.js'], // files containing annotations as above
};

// HTTP Logger options
const httpLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'http.log' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// Morgan options
const morganOptions = {
  stream: {
    write: (message) => {
      // 로그를 'info' 레벨로 사용하며, 끝에 있는 개행 문자를 제거
      httpLogger.info(message.trim());
    },
  },
};

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error(err));

app.use(express.json());

app.use(morgan('combined', morganOptions));

// 정적 파일 서비스를 위한 middleware 설정
app.use(express.static(path.join(__dirname, 'public')));

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// [user_infos] collection에 인증 대한 router 등록
const userInfoAuthRouter = require('./routes/auth');
app.use('/api/auth', userInfoAuthRouter);

// [user_infos] collection에 대한 router 등록
const userInfoRouter = require('./routes/users');
app.use('/api/user', userInfoRouter);

// [todos] collection에 대한 router 등록
const todoRouter = require('./routes/todos');
app.use('/api/todos', todoRouter);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
