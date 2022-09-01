// 已重构
import * as Koa from "koa";
import fetch from "node-fetch";
import { githubAPIUrls } from "../config/github.config";

// 从GitHub上请求仓库搜索结果（只能搜索到自己仓库的内容）
export const searchRepo = async (ctx: Koa.Context) => {
   const q = ctx.query.q;
   const ghId = ctx.query.ghId;
   const ghToken = ctx.query.token;
   const queryString = `?q=${q}+user:${ghId}`;

   const res = await fetch(`${githubAPIUrls.searchRepo}${queryString}`, {
      headers: {
         accept: "application/json",
         Authorization: `token ${ghToken}`
      }
   }).then(res => res.json());

   ctx.body = res;
}