const express = require('express');

const { check } = require('express-validator');
const { checkParams } = require('../../utils/params');
const { signup, rememberUser, testUserExist, signin, getLoginUser, updateUser } = require('../../utils/user');

const router = express.Router();

const NEW_USER_NAME = 'newUser'

router.get('/test', (req, res)=>{
  res.send({
    code: req.app.get('CODE_TYPE').SUCCESS,
    msg: 'test',
    data: 'testData'
  })
})

// 注册
/**
 * @param { string } username 用户名
 * @param { string } password 密码
 */
router.use('/signup', [
  check('username', '用户名必填').not().isEmpty().not().matches(/[\u4E00-\u9FA5]/), // 不包含汉字
  check('password', '密码必填').not().isEmpty(),
], async (req, res) => {
  if (checkParams(req, res)) {
    const db = req.app.get('db');
    const { username, password } = req.body;
    // 查username是否唯一
    const isOnlyName = !(await testUserExist(db, username));
    if (isOnlyName) {
      const user = await signup(db, username, password, NEW_USER_NAME);
      delete user.password;
      const token = rememberUser(res, user.userId, req.app.get('secretKey'));
      // 注册成功返回
      res.send({
        code: req.app.get('CODE_TYPE').SUCCESS,
        msg: '操作成功',
        data: {
          ...user,
          token
        }
      });
    } else {
      res.send({
        code: req.app.get('CODE_TYPE').CLIENT_ERROR,
        msg: '用户名已被使用',
      });
    }
  }
});

// 登录
/**
 * @param { string } username 用户名
 * @param { string } password 密码
 */
router.use('/login', [
  check('username', '用户名必填').not().isEmpty().not().matches(/[\u4E00-\u9FA5]/),
  check('password', '密码必填').not().isEmpty(),
], async (req, res) => {
  if (checkParams(req, res)) {
    const db = req.app.get('db');
    const { username, password } = req.body;
    const user = await signin(db, username, password);
    // 登录成功返回
    if (user) {
      delete user.password;
      delete user.salt;
      const token = rememberUser(res, user.userId, req.app.get('secretKey'));
      res.send({
        code: req.app.get('CODE_TYPE').SUCCESS,
        msg: '操作成功',
        data: {
          ...user,
          token
        }
      });
    } else { // 用户名或密码错误
      res.send({
        code: req.app.get('CODE_TYPE').CLIENT_ERROR,
        msg: '账号或密码错误',
        data: {}
      });
    }
  }
});

// 使用token换取用户信息
router.use('/switch', async (req, res) => {
  const user = await getLoginUser(req);
  if (user) {
    delete user.password;
  }
  res.send({
    code: req.app.get('CODE_TYPE').SUCCESS,
    msg: '操作成功',
    data: user
  });
});

// 更新nickName
router.use('/updatenickname', [
  check('userId', '用户id必填').not().isEmpty(),
  check('nickName', '昵称必填').not().isEmpty(),
], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const { userId, nickName } = req.body;
  const db = req.app.get('db');
  try{
    const user = await updateUser(db, userId, {nickName});
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: user
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').SERVER_ERROR,
      msg: '更新失败',
    });
  }
})

module.exports = router;