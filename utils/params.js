const { validationResult } = require('express-validator');

function checkParams(req, res){
  const errors = validationResult(req);
  if(errors.isEmpty()){
    return true;
  }else{
    const errorArray = errors.array();
    let errStr = '';
    errorArray.forEach(error => {
      errStr+=`[param:${error.param}, msg:${error.msg}, value:${error.value}]`;
    });
    res.send({
      code: req.app.get('CODE_TYPE').CLIENT_ERROR,
      msg: `参数错误：${errStr}`,
      data: {}
    });
  }
}

module.exports = {
  checkParams,
}