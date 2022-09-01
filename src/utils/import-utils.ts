// 已重构
// 复制工具
import fetch from "node-fetch";
import * as dayjs from "dayjs";
import { IBranch, ICommit, ICommitChanges, IFileTreeNode } from "../types/repo";
import { IGHBranchesRes } from "../types/github-api/branch";
import { IGHCommitRes } from "../types/github-api/commit";
import { IGHTreeRes } from "../types/github-api/tree";

// 复制多个分支
export const cloneManyBranch = async (url: string, headers: any,): Promise<IBranch[]> => {
  const branchesResponse: IGHBranchesRes = await fetch(url, { headers }).then(res => res.json());
  const clonedBranches: IBranch[] = [];
  for (const branch of branchesResponse) {
    clonedBranches.push({
      name: branch.name,
      // 334fab25a5e5158ae04f70c19207149064fe67ac
      commitHeadSha: branch.commit.sha
    } as IBranch);
  }
  return clonedBranches;
};

// 复制多次提交
export const cloneManyCommit = async (url: string, headers: any) => {
  let manyCommitResponse: IGHCommitRes[] = await fetch(url, { headers }).then(res => res.json());
  const commitPrs: Promise<ICommit>[] = [];
  for (const res of manyCommitResponse) {
    commitPrs.push(cloneOneCommit(res.url, headers));
  }
  return await Promise.all(commitPrs);
};

// 复制单次提交
export const cloneOneCommit = async (url: string, headers: any) => {
  const res: any = await fetch(url, { headers }).then(res => res.json());

  // 请求每个变更的文件的内容
  const fetchRawContentPromises: Promise<ICommitChanges>[] = (
    res.files || []
  ).map((file: any) =>
    fetch(file.contents_url, { headers }).then(res => res.json())
      .then(res => {
        return {
          sha: file.sha,
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
          rawContent:
            // 对文件内容进行转码
            res.encoding === "base64" ? Buffer.from(res.content, 'base64').toString() : res.content
        };
      })
  );

  const changedFiles: ICommitChanges[] = await Promise.all<ICommitChanges>(
    fetchRawContentPromises
  );

  return {
    sha: res.sha,
    message: res.commit.message,
    committer: { id: res.commit?.committer?.name || "" },
    committedAt: dayjs(res.commit.committer.date).toDate().getTime(),
    author: { id: res.commit?.author?.name || "" },
    stats: { // 统计数据
      total: res.stats.total,
      additions: res.stats.additions,
      deletions: res.stats.deletions
    },
    parents: res.parents.map((parent: any) => {
      return {
        sha: parent.sha
      };
    }),
    changedFiles,
    // relatedTree: res.commit.tree.sha
  };
};

// 二进制块
export type Blobs = { sha: string; url: string }[];

// 复制多个文件结构
export const cloneManyTree = async (url: string, headers: any, dir = ""): Promise<[IFileTreeNode[], Blobs]> => {
  const res: IGHTreeRes = await fetch(url, { headers }).then(res => res.json());
  const { tree: trees } = res;

  const allPromises: Promise<[IFileTreeNode[], Blobs]>[] = [];

  for (const tree of trees) {
    const fetchTreePromise: Promise<[IFileTreeNode[], Blobs]> = new Promise((resolve, reject) => {
      try {
        let rootNode: IFileTreeNode[] = [];
        let blobs: Blobs = [];
        const { path, url: treeUrl, type, sha } = tree;
        const newDir = dir === "" ? path : `${dir}/${path}`;
        if (type === "blob") {
          blobs.push({ sha, url: treeUrl });
          rootNode.push({
            type: "FILE",
            path,
            fullyQualifiedName: newDir,
            sha,
            subTrees: []
          });
          resolve([rootNode, blobs]);
        } else if (type === "tree") {
          cloneManyTree(treeUrl, headers, newDir).then(
            ([subTrees, subBlobs]) => {
              const folderTreeNode: IFileTreeNode = {
                subTrees,
                type: "FOLDER",
                fullyQualifiedName: newDir,
                path,
                sha
              };
              rootNode = [folderTreeNode, ...rootNode];
              blobs = [...subBlobs, ...blobs];
              resolve([rootNode, blobs]);
            }
          );
        }
      } catch (e) {
        reject(e);
      }
    });

    allPromises.push(fetchTreePromise);
  }

  const finalResult = await Promise.all(allPromises);
  const rootNode: IFileTreeNode[] = [];
  const blobs: Blobs = [];

  for (const result of finalResult) {
    rootNode.push(...result[0]);
    blobs.push(...result[1]);
  }

  return [rootNode, blobs];
};