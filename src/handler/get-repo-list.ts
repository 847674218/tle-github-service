// 已重构
import * as Koa from "koa";
import fetch from "node-fetch";
import { githubAPIUrls } from "../config/github.config";

// 获取所有GitHub仓库
export const getRepoList = async (ctx: Koa.Context) => {
   const ghToken = ctx.query.token;
   const page = ctx.query.page || 1;
   const perPage = ctx.query.perPage || 10;
   const sort = ctx.query.sort || "updated";

   // 按更新时间显示一页，每页有十个数据
   const res = await fetch(`${githubAPIUrls.fetchRepo}?page=${page}&per_page=${perPage}&sort=${sort}`,
      {
         headers: {
            accept: "application/json",
            Authorization: `token ${ghToken}`
         }
      }
   ).then(res => res.json());

   ctx.body = res;
}