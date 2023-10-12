const express = require('express');

const { check } = require('express-validator');
const { checkParams } = require('../../utils/params');
const { signup, rememberUser, testUserExist, signin, getLoginUser } = require('../../utils/user');

const router = express.Router();

const REMEMBER_STATE = {
  NO: 0,
  YES: 1,
}
const NEW_USER_NAME = 'newUser'

router.use('/signup',[
  check('username', '用户名必填').not().isEmpty().not().matches(/[\u4E00-\u9FA5]/),
  check('password', '密码必填').not().isEmpty(),
  check('remember', 'remember不可为空').not().isEmpty().isNumeric(),
], async (req, res)=>{
  if(checkParams(req, res)){
    const db = req.app.get('db');
    const {username, password, remember} = req.body;
    // 传过来的是表单，会处理成字符串
    remember = parseInt(remember);
    // 查username是否唯一
    const isOnlyName = !(await testUserExist(db, username));
    if(isOnlyName){
      await signup(db, username, password, NEW_USER_NAME);
      // 注册成功返回
      if(remember === REMEMBER_STATE.YES){
        rememberUser(res, username, req.app.get('secretKey'));
      }
      res.send({
        code: req.app.get('CODE_TYPE').SUCCESS,
        msg: '操作成功',
        data: {
          username: username,
          name: NEW_USER_NAME,
          isManager: 0,
        }
      });
    }else{
      res.send({
        code: req.app.get('CODE_TYPE').CLIENT_ERROR,
        msg: '用户名已被使用',
        data: {}
      });
    }
  }
});

router.use('/signin', [
  check('username', '用户名必填').not().isEmpty().not().matches(/[\u4E00-\u9FA5]/),
  check('password', '密码必填').not().isEmpty(),
  check('remember', 'remember不可为空').not().isEmpty().isNumeric(),
], async (req, res)=>{
  if(checkParams(req, res)){
    const db = req.app.get('db');
    const {username, password, remember} = req.body;
    const user = await signin(db, username, password);
    // 登录成功返回
    if(user){
      if(remember === REMEMBER_STATE.YES){
        rememberUser(res, username, req.app.get('secretKey'));
      }
      res.send({
        code: req.app.get('CODE_TYPE').SUCCESS,
        msg: '操作成功',
        data: {
          username: user.username,
          name: user.name,
          isManager: user.isManager,
        }
      });
    }else{ // 用户名或密码错误
      res.send({
        code: req.app.get('CODE_TYPE').CLIENT_ERROR,
        msg: '账号或密码错误',
        data: {}
      });
    }
  }
});

router.use('/loginstatus', async (req, res)=>{
  const user = await getLoginUser(req);
  if(user){
    const sendUser = {
      username: user.username,
      name: user.name,
      isManager: user.isManager,
    };
    sendLoginState(req, res, 1, sendUser);
  }else{
    sendLoginState(req, res, 0, null);
  }
});

function sendLoginState(req, res, isLogin, user){
  res.send({
    code: req.app.get('CODE_TYPE').SUCCESS,
    msg: '操作成功',
    data: {
      isLogin,
      user
    }
  });
}

// 退出登录，清除cookie
router.use('/signout', (req, res) => {
  res.clearCookie('token');
  res.send({
    code: req.app.get('CODE_TYPE').SUCCESS,
    msg: '操作成功',
    data: {}
  })
});

module.exports = router;