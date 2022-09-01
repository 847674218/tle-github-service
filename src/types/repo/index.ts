// 已重构
// 仓库信息数据定义

// 导入的仓库
export interface IImportedRepository {
   _id: string;
   name: string;
   ownerId: string;
   currentBranch: string;
   // 这里跟前端的数据类型定义有出入（因为前端需要用到语言对应的颜色）
   language: string;
   description: string;
   stakeholders: string[];
   branches: IBranch[];
   commits: ICommit[];
   trees: IFileTreeNode[];
   shaFileContentMap: ShaFileContentMap;
   lastUpdateAt?: number;
}

// 分支
export interface IBranch {
   name: string;
   commitHeadSha: string;
}

// 提交
export interface ICommit {
   sha: string;
   message: string;
   committer: { id?: string } | null;
   committedAt: number;
   author: { id: string } | null;
   stats: {
      total: number;
      additions: number;
      deletions: number
   };
   parents: { sha: string; }[];
   changedFiles: ICommitChanges[];
}

// 单次提交的变更内容
export interface ICommitChanges {
   sha: string;
   filename: string;
   status: string;
   additions: number;
   deletions: number;
   // 补丁（文件内容的变更）
   patch: string;
   // 文件内容
   rawContent: string;
}

// 文件树结点
export interface IFileTreeNode {
   sha: string;
   path: string;
   fullyQualifiedName: string;
   type: "FOLDER" | "FILE";
   subTrees: IFileTreeNode[] | null;
}

export type ShaFileContentMap = {
   [key: string]: string
};