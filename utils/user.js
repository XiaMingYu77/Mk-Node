const jwt = require('jsonwebtoken');

/*
  负责user的鉴权中间件、user的db操作
*/
function signup(db, username, password, name, isManager=0){
  return new Promise((resolve, reject)=>{
    const sql = 'INSERT INTO User (username, password, name, isManager) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, password, name, isManager], (error, results )=>{
      if(error) reject(error);
      else resolve(results);
    });
  })
}

function signin(db, username, password){ // 登录成功返回user，失败返回空
  return new Promise((resolve, reject)=>{
    const sql = 'SELECT * FROM User WHERE username = ?';
    db.query(sql, [username], (error, results)=>{
      if(error) reject(error);
      else{
        if(results.length === 0) resolve(null);
        const user = results[0];
        if(user.password !== password) resolve(null);
        resolve(user);
      }
    })
  })
}

function testUserExist(db, username){
  return new Promise((resolve, reject)=>{
    const sql = 'SELECT COUNT(*) as count FROM User WHERE username = ?;';
    db.query(sql, [username], (error, results)=>{
      if(error) reject(error);
      resolve(results[0].count !== 0);
    })
  })
}
/*
  当需要cookie记住用户时调用
  过期由cookie过期控制
*/
function rememberUser(res, username, secretKey){
  const payload = {
    username
  };
  const token = jwt.sign(payload, secretKey);
  res.cookie('token', token, {
    maxAge: 1296000000, // 15天
    httpOnly: true,
  });
}

// 用户鉴权
async function userIdentify(req, res, next){
  const token = req.cookies.token;
  if(!token) res.redirect('/#/login');
  try{
    const payload = jwt.verify(token, req.app.get('secretKey'));
    const exist = await testUserExist(req.app.get('db'), payload.username);
    if(exist){
      req.username = payload.username;
      next();
    }else{
      res.redirect('/#/login');
    }
  }catch(e){
    console.error(e);
  }
}

// 获取用户登录态（从cookie中拿）
// 无cookie直接回空
function getLoginUser(req){
  return new Promise((resolve, reject)=>{
    const token = req.cookies.token;
    if(!token) resolve(null);
    try{
      const {username} = jwt.verify(token, req.app.get('secretKey'));
      const sql = 'SELECT * FROM User WHERE username = ?';
      req.app.get('db').query(sql, [username], (error, results)=>{
        if(error) reject(error);
        else{
          if(results.length === 0) resolve(null);
          const user = results[0];
          resolve(user);
        }
      })
    }catch(e){
      console.error(e);
    }
  })
}

module.exports = {
  signup,
  signin,
  testUserExist,
  getLoginUser,
  rememberUser,
}