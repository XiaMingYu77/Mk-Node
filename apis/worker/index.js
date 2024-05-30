const express = require('express');

const { check } = require('express-validator');
const { checkParams } = require('../../utils/params');
const { userIdentify } = require('../../utils/user');
const {
  ProjectStatusMap,
  createProject,
  updateProject,
  getProject,
  getProjectList
} = require('../../utils/projectManager');

const router = express.Router();

router.get('/projectdata', [
  check('key').notEmpty()
], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const { key } = req.query;
  try{
    const projectData = await getProject(db, key);
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: projectData
    });
  }catch(e){
    res.send({
      code: '404',
      msg: '项目不存在',
    });
  }
});

// 后面的要进行用户鉴权
router.use(userIdentify);
router.use('/create', [
  check('projectName', '项目名必填').not().isEmpty(),
  check('jsonData', '内容必填').not().isEmpty(),
  check('picUrl', '封面必填').not().isEmpty()
], async (req, res) => {
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const userId = req.userId;
  const { projectName, jsonData, picUrl } = req.body;
  try {
    const projectData = await createProject(db, {projectName, picUrl, jsonData, userId});
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: projectData
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').CLIENT_ERROR,
      msg: '项目创建失败',
    });
    console.error(e);
  }
});

router.get('/test', (req, res)=>{
  res.send({
    code: req.app.get('CODE_TYPE').SUCCESS,
    msg: 'test',
    data: 'testData'
  })
})

router.use('/update', [
  check('key').notEmpty(),
  check('projectName').notEmpty(),
  check('jsonData').notEmpty(),
  check('picUrl').notEmpty()
], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const { key, projectName, jsonData, picUrl } = req.body;
  try{
    const projectData = await updateProject(db, {
      projectId: key,
      projectName,
      picUrl,
      jsonData
    });
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: projectData
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').CLIENT_ERROR,
      msg: '更新失败',
    });
  }
});

router.use('/publish', [
  check('key').notEmpty(),
  check('projectName'),
  check('jsonData'),
  check('picUrl')
], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const userId = req.userId;
  const { key, projectName, jsonData, picUrl } = req.body;
  let projectData = null;
  try{
    if(key){ // 如果有key表明是已有项目的更新
      projectData = await updateProject(db, {
        projectId: key, 
        projectName, 
        picUrl, 
        jsonData, 
        status:ProjectStatusMap.Publishing
      });
    }else { // 没有表示是新建
      projectData = await createProject(db, {
        projectName,
        picUrl,
        jsonData,
        userId,
        status:ProjectStatusMap.Publishing
      });
    }
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: projectData
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').CLIENT_ERROR,
      msg: '发布失败',
    });
  }
});

router.use('/unpublish', [check('key').notEmpty()], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const { key } = req.body;
  try{
    const projectData = await updateProject(db, {
      projectId: key, 
      status:ProjectStatusMap.Setting
    });
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: projectData
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').CLIENT_ERROR,
      msg: '下架失败',
    });
  }
})

router.get('/projectList', [
  check('pageSize').notEmpty().isInt(),
  check('pageNumber').notEmpty().isInt(),
], async (req, res)=>{
  if(!checkParams(req, res)) return;
  const db = req.app.get('db');
  const query = req.query;
  const { pageSize, pageNumber } = req.query;
  delete query.pageSize;
  delete query.pageNumber;
  query.userId = req.userId;
  try{
    const ans = await getProjectList(db, query, Number(pageSize), Number(pageNumber));
    res.send({
      code: req.app.get('CODE_TYPE').SUCCESS,
      msg: '操作成功',
      data: ans
    });
  }catch(e){
    res.send({
      code: req.app.get('CODE_TYPE').SERVER_ERROR,
      msg: e,
    });
  }
})


module.exports = router;