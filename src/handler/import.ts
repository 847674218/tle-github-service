// 已重构
import fetch from "node-fetch";
import { IGHRepositoryRes } from "../types/github-api/repository";
import { IGHBlobRes } from '../types/github-api/blob';
import { cloneManyBranch, cloneManyCommit, cloneManyTree } from './../utils/import-utils';

// 导入仓库
export const setUpImportRepo = (io: SocketIO.Server): void => {
   io.on("connection", (socket) => {
      socket.on("startImport", async (repoRes: IGHRepositoryRes, ghToken: string) => {
         try {
            let stop: boolean = false;
            socket.on("stopImport", () => stop = true);

            const headers = {
               accept: "application/json",
               Authorization: `token ${ghToken}`
            };

            let {
               // https://api.github.com/repos/847674218/TestDemo/branches{/branch}
               branches_url: branchesUrl,
               // https://api.github.com/repos/847674218/TestDemo/commits{/sha}
               commits_url: commitsUrl,
               // https://api.github.com/repos/847674218/TestDemo/git/trees{/sha}
               trees_url: treesUrl
            } = repoRes;

            // 1. clone branch
            branchesUrl = branchesUrl.replace("{/branch}", "");
            const branches = await cloneManyBranch(branchesUrl, headers);
            socket.emit("importBranchDone", branches);

            if (stop)
               socket.disconnect();

            // 2. clone commit
            commitsUrl = commitsUrl.replace("{/sha}", "");
            const commits = await cloneManyCommit(commitsUrl, headers);
            socket.emit("importCommitDone", commits);

            if (stop)
               socket.disconnect();

            // 3. clone file structure
            treesUrl = treesUrl.replace("{/sha}", "");
            let masterHeadSha;
            // 选择仓库默认分支上的提交（应该是最新的文件结构）
            for (const branch of branches || []) {
               if (branch.name === repoRes.default_branch) {
                  masterHeadSha = branch.commitHeadSha;
                  break;
               }
            }

            // https://api.github.com/repos/847674218/TestDemo/git/trees/3e7dcffc0c433ed4197a5771e69badbe87cbc8d4
            const [trees, blobs] = await cloneManyTree(`${treesUrl}/${masterHeadSha}`, headers);
            socket.emit("importFileStructureDone", trees);

            if (stop)
               socket.disconnect();

            // 4. clone file content
            let shaFileContentMap: any = {};
            const fetchPromises: Promise<IGHBlobRes>[] = [];
            for (const blob of (blobs || [])) {
               const fetchPromise = fetch(blob.url, { headers }).then(res => res.json());
               fetchPromises.push(fetchPromise);
            }
            const blobsRes: IGHBlobRes[] = await Promise.all(fetchPromises);
            blobsRes.forEach(({ sha, content, encoding }) => {
               shaFileContentMap[sha] =
                  encoding === "base64" ? Buffer.from(content, 'base64').toString() : content;
            });

            socket.emit("importFileContentDone", shaFileContentMap);

            socket.emit("allDone");

            socket.disconnect();
         } catch (e) {
            console.log(e);
         }
      })
   })
}

// export const setUpImportRepo = (io) => {
//    io.on("connection", (socket) => {   // 与前端建立通信
//       socket.on("startImport", async (ghToken) => {   // 开始导入过程
//          try {
//             socket.on("stopImport", () => stop = true);  // 一旦收到停止导入指令，将stop置为true
//             // 设置请求头数据，包含接收的数据格式和access_token
//             const headers = {
//                accept: "application/json",
//                Authorization: `token ${ghToken}`
//             };
//             // 克隆分支，并将结果返回给前端
//             const branches = await cloneManyBranch(branchesUrl, headers);
//             socket.emit("importBranchDone", branches);
//             // 克隆结束后判断有没有收到停止导入指令
//             if (stop)
//                socket.disconnect();
//             // 以相同方式克隆提交记录、文件结构和文件内容并返回给前端，同样在克隆结束后判断要不要停止导入（代码略）
//             // 四个步骤克隆结束后，发送allDone指令并断开连接
//             socket.emit("allDone");
//             socket.disconnect();
//          } catch (e) {
//             console.log(e);
//          }
//       })
//    })
// }