const express = require('express');
const UserInfo = require('../models/user_info.js');
const Todo = require('../models/todo.js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./middlewares/authorization');
const { getFormattedDate } = require('../utils/dateUtils');
require('dotenv').config();
const router = express.Router();

const options = {
  iss: process.env.JWT_ISSUER,
  aud: process.env.JWT_AUDIENCE,
};

const createHashedPassword = (password) => {
  return crypto.createHash('sha512').update(password).digest('base64');
};

/**
 * @swagger
 * /api/auth/public/search:
 *   get:
 *     tags:
 *       - 회원 인증 API
 *     summary: 이메일 중복 확인
 *     security:
 *       - JWT: []
 *     description: 쿼리로 들어온 이메일과 DB 내의 이메일들에 대하여 중복 여부를 확인합니다.
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "User with this email already exists"
 *       409:
 *         description: Conflict
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "User with this email already exists"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.get('/public/search', async (req, res) => {
  const email = req.query.email;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({ email });
    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
      });
    }

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/public/login:
 *   post:
 *     tags:
 *       - 회원 인증 API
 *     summary: 로그인
 *     security:
 *      - JWT: []
 *     description: 사용자 (이메일/비밀번호)를 통해 로그인 후 액세스 토큰을 발급합니다.
 *     parameters:
 *       - in: body
 *         name: loginRequest
 *         description: loginRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzaW5hYnJvIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo1MDUwIiwic3ViIjoiNjRiYWNhNDQxYjA2ZjU2OTJkNTljYTg1IiwiaWF0IjoxNjkwNDIxOTA3LCJleHAiOjE2OTA0MjI1MDd9.0SOH2JtMICYXxdglFzBeciuOD1MbZUqlEkm3zF_lPnU"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid credentials"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/public/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Bad request' });

  try {
    const user = await UserInfo.findOne({
      email,
      password: createHashedPassword(password),
    });
    if (user) {
      options.sub = user._id;
      const token = jwt.sign(options, process.env.JWT_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      });

      res.cookie('user', token);
      return res.status(200).json({ accessToken: token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/public/sign-up:
 *   post:
 *     tags:
 *       - 회원 인증 API
 *     summary: 회원가입
 *     description: (이메일, 비밀번호, 닉네임)을 통해 신규 회원을 등록합니다.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: signUpRequest
 *         description: signUpRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             username:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             username:
 *               type: string
 *             createdTime:
 *               type: string
 *             __v:
 *               type: number
 *       400:
 *         description: Bad request
 *         schema:
 *           type: object
 *           properties:
 *             errror:
 *               type: string
 *               example: "Bad request or user with this email already exists"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/public/sign-up', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Bad request' });
  }

  try {
    // 이메일이 이미 존재하는지 확인
    const existingUser = await UserInfo.findOne({ email });

    // 이미 존재하는 이메일이면 에러 메시지를 전달
    if (existingUser) {
      return res.status(400).json({
        error: 'Bad request or user with this email already exists',
      });
    }

    const user = new UserInfo({
      email,
      password: createHashedPassword(password),
      username,
      createdTime: getFormattedDate(),
    });

    const newUser = await new UserInfo(user).save();
    return res.status(201).json(newUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/private/delete-account:
 *   delete:
 *     tags:
 *       - 회원 인증 API
 *     summary: 회원 탈퇴
 *     description: 인증된 사용자의 계정을 삭제합니다.
 *     security:
 *       - JWT: []
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Account deleted successfully"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Invalid token"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.delete('/private/delete-account', verifyToken, async (req, res) => {
  const userId = res.locals.sub;

  try {
    await UserInfo.findByIdAndDelete(userId);

    /** todos collection 내에 동일한 userId를 가진 document(s)가
     * 있는지 확인 후 해당 document(s) 제거 */
    await Todo.deleteMany({
      userId,
    });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
