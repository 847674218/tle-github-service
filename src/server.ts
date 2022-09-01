// 已重构
// 主服务页面
import * as Koa from 'koa';
import * as http from "http";
import * as Router from 'koa-router';
import * as socketio from "socket.io";
import { getRepoList } from './handler/get-repo-list';
import { searchRepo } from './handler/search-repo';
import { setUpImportRepo } from './handler/import';
import cors = require('@koa/cors');

const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 8081;

app.use(cors({ "origin": "http://localhost:3000", }));
app.use(router.routes());

// 导入仓库
const server = http.createServer(app.callback());
// 从前端传送过来的信息
const io = socketio(server);
setUpImportRepo(io);

// 从GitHub请求所有仓库
router.get("/repos", getRepoList);
// 搜索GitHub仓库
router.get("/search", searchRepo);
// 打印监听
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));