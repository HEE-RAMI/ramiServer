const express = require('express');
const mongoose = require('mongoose');
const Todo = require('../models/todo.js');
const { verifyToken } = require('./middlewares/authorization');
const { getFormattedDate } = require('../utils/dateUtils');
const router = express.Router();

/** ⚙️ [todos] collection에 대한 Model definition
 * @swagger
 * definitions:
 *   Todo:
 *     type: object
 *     required:
 *       - _id
 *       - content
 *       - createdTime
 *       - userId
 *       - __v
 *     properties:
 *       _id:
 *         type: string
 *         format: ObjectId
 *         description: todoID
 *       content:
 *         type: string
 *         description: Todo 대한 내용
 *       createdTime:
 *         type: string
 *         example: "2023-07-29 20:44:51.681"
 *         description: Todo 정보가 추가된 일자 및 시각
 *       userId:
 *         type: string
 *         format: ObjectId
 *         description: todoId와 연관된 userId
 *       __v:
 *         type: number
 *         description: version key
 */

// :id값에 따른 document 중 todoId값이 :id와 동일한 document 설정 및 조회
const getTodo = async (req, res, next) => {
  const todoId = req.params.id;

  if (!todoId) return res.status(400).json({ error: 'Bad Request' });
  if (!mongoose.Types.ObjectId.isValid(todoId))
    return res.status(415).json({ error: 'Unsupported Media Type' });

  try {
    const todo = await Todo.findById(todoId);
    if (!todo) return res.status(404).json({ error: 'Not Found' });

    res.todo = todo;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /api/todos/private:
 *   get:
 *     tags:
 *       - Todos Collection 기반 API
 *     summary: Todo 정보 목록 반환
 *     security:
 *       - JWT: []
 *     description: (todos) collection 내에서 사용자가 등록한 Todo 정보 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           items:
 *             $ref: '#/definitions/Todo'
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unauthorized"
 *       404:
 *         description: Not Found
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Not Found"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.get('/private', verifyToken, async (req, res) => {
  const userId = res.locals.sub;

  try {
    const todos = await Todo.find({ userId });
    if (todos.length === 0) return res.status(404).json({ error: 'Not Found' });

    return res.status(200).json(todos);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/private:
 *   post:
 *     tags:
 *       - Todos Collection 기반 API
 *     summary: Todo 정보 추가
 *     security:
 *       - JWT: []
 *     description: 새로운 Todo 정보를 추가합니다.
 *     parameters:
 *       - in: body
 *         name: todosRequest
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *     responses:
 *       201:
 *         description: Created
 *         schema:
 *           $ref: '#/definitions/Todo'
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Bad Request"
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Unauthorized"
 *       500:
 *         description: Internal Server Error
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/private', verifyToken, async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Bad Request' });

  const userId = res.locals.sub;

  try {
    const todo = new Todo(req.body);
    todo.userId = userId;
    todo.createdTime = getFormattedDate();
    const newTodo = await todo.save();
    return res.status(201).json(newTodo);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/private/todos/{todoId}:
 *   patch:
 *    tags:
 *      - Todos Collection 기반 API
 *    summary: 특정 Todo 내용 수정
 *    security:
 *      - JWT: []
 *    description: Todo 내용을 수정합니다.
 *    parameters:
 *      - in: path
 *        name: todoId
 *        required: true
 *        description: todoId
 *        type: string
 *      - in: body
 *        name: todoRequest
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            content:
 *              type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "OK"
 *      400:
 *        description: Bad request
 *        schema:
 *          type: object
 *          properties:
 *            errror:
 *              type: string
 *              example: "Bad Request"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unauthorized"
 *      404:
 *        description: Not Found
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Not Found"
 *      415:
 *        description: Unsupported Media Type
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unsupported Media Type"
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.patch('/private/todos/:id', verifyToken, getTodo, async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Bad Request' });

  const todo = res.todo;

  try {
    const result = await Todo.updateMany(
      { _id: todo._id }, // Filter
      { $set: { content } } // Update action
    );

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/todos/private/todos/{todoId}:
 *   delete:
 *    tags:
 *      - Todos Collection 기반 API
 *    summary: 특정 Todo 정보 제거
 *    security:
 *      - JWT: []
 *    description: Todo 내용 삭제
 *    parameters:
 *      - in: path
 *        name: todoId
 *        required: true
 *        description: todoId
 *        type: string
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "OK"
 *      400:
 *        description: Bad request
 *        schema:
 *          type: object
 *          properties:
 *            errror:
 *              type: string
 *              example: "Bad Request"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unauthorized"
 *      404:
 *        description: Not Found
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Not Found"
 *      415:
 *        description: Unsupported Media Type
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Unsupported Media Type"
 *      500:
 *        description: Internal Server Error
 *        schema:
 *          type: object
 *          properties:
 *            error:
 *              type: string
 *              example: "Internal Server Error"
 */
router.delete('/private/todos/:id', verifyToken, getTodo, async (req, res) => {
  try {
    await res.todo.deleteOne();
    return res.status(200).json({ message: 'OK' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
