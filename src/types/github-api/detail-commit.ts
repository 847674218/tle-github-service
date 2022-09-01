import {
  IGHCommitSimpleAuthorAndCommitter,
  IGHCommitDetailAuthorAndCommitter,
  IGHCommitParent
} from "./commit";

export interface IGHCommitStats {
  total: number;
  additions: number;
  deletions: number;
}

export interface IGHCommitChangeFile extends IGHCommitStats {
  sha: string;
  filename: string;
  status: string;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

export interface IGHDetailCommitRes {
  sha: string;
  node_id: string;
  commit: {
    author: IGHCommitSimpleAuthorAndCommitter;
    committer: IGHCommitSimpleAuthorAndCommitter;
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: null; //TODO
      payload: null; // TODO
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: IGHCommitDetailAuthorAndCommitter;
  committer: IGHCommitDetailAuthorAndCommitter;
  parents: IGHCommitParent[];
  stats: IGHCommitStats;
  files: IGHCommitChangeFile[];
}
