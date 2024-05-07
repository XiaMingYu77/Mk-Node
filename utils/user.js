const jwt = require('jsonwebtoken');

function getUser(db, username) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM User WHERE username = ?';
    db.query(sql, [username], (error, results) => {
      if (results[0]) resolve(results[0]);
      else reject();
    })
  })
}

function getUserById(db, userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM User WHERE userId = ?';
    db.query(sql, [userId], (error, results) => {
      if (results[0]) resolve(results[0]);
      else reject();
    })
  })
}

/*
  负责user的鉴权中间件、user的db操作
*/
// 注册
function signup(db, username, password, nickName) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO User (username, password, nickName) VALUES (?, ?, ?);';
    db.query(sql, [username, password, nickName], async (error) => {
      if (error) reject(error);
      const user = await getUser(db, username);
      resolve(user);
    });
  })
}

function signin(db, username, password) { // 登录成功返回user，失败返回空
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM User WHERE username = ?';
    db.query(sql, [username], (error, results) => {
      if (error) reject(error);
      else {
        if (results.length === 0) {
          resolve(null);
          return;
        }
        const user = results[0];
        if (user.password !== password){
          resolve(null);
          return
        }
        resolve(user);
      }
    })
  })
}

function testUserExist(db, userId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM User WHERE userId = ?;';
    db.query(sql, [userId], (error, results) => {
      if (error) reject(error);
      resolve(results[0].count !== 0);
    })
  })
}
/*
  当需要cookie记住用户时调用
  过期由cookie过期控制
*/
function rememberUser(res, userId, secretKey) {
  const payload = {
    userId
  };
  const token = jwt.sign(payload, secretKey);
  res.cookie('token', token, {
    maxAge: 1296000000 // 15天
  });
}

// 用户鉴权中间件
async function userIdentify(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    res.send({
      code: req.app.get('CODE_TYPE').UNLOGIN,
      msg: '未登录',
    });
    return;
  }
  try {
    const payload = jwt.verify(token, req.app.get('secretKey'));
    const exist = await testUserExist(req.app.get('db'), payload.userId);
    if (exist) {
      req.userId = payload.userId;
      next();
    } else { // 如果不存在返回无此用户
      res.send({
        code: req.app.get('CODE_TYPE').CLIENT_ERROR,
        msg: '账号或密码错误',
      });
    }
  } catch (e) {
    console.error(e);
  }
}

// 获取用户登录态（从cookie的Token中拿）
// 无cookie直接回空
function getLoginUser(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies.token;
    if (!token) return resolve(null);
    try {
      const { userId } = jwt.verify(token, req.app.get('secretKey'));
      const sql = 'SELECT * FROM User WHERE userId = ?';
      req.app.get('db').query(sql, [userId], (error, results) => {
        if (error) reject(error);
        else {
          if (results.length === 0) resolve(null);
          const user = results[0];
          resolve(user);
        }
      })
    } catch (e) {
      console.error(e);
    }
  })
}

function updateUser(db, userId, { username, nickName, password }){
  const updateFields = {};
  
  if (username) {
    updateFields.userName = username;
  }
  if (nickName) {
    updateFields.nickName = nickName;
  }
  if (password) {
    updateFields.password = password;
  }

  return new Promise((resolve, reject)=>{
    const sql = 'UPDATE User SET ? WHERE userId = ?;';
    db.query(sql, [updateFields, userId], async (error, result) => {
      if(error) return reject(error);
      if (result.affectedRows === 0) {
        return reject(new Error('未找到匹配的用户，更新失败'));
      }
      const user = await getUserById(db, userId);
      return resolve(user);
    })
  })
}

module.exports = {
  signup,
  signin,
  testUserExist,
  getLoginUser,
  rememberUser,
  userIdentify,
  updateUser
}