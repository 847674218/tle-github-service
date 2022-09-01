interface IGHTreeResInnerTree {
  path: string;
  mode: string;
  type: "blob" | "tree";
  size: number;
  sha: string;
  url: string;
}

export interface IGHTreeRes {
  sha: string;
  url: string;
  tree: IGHTreeResInnerTree[];
  truncated: boolean;
}
