
export class Node {
  constructor(
    public path: string = '',
  ) {}
  name: string = '';
  children: Node[] = [];
};

function fill (node:Node, paths:string[]) {
  let cMap = {};
  paths.forEach(file => {
    let parts = file.split('/');
    if (!cMap[parts[0]]) {
      let fullPath = node.path + '/' + parts[0];
      cMap[parts[0]] = {
        paths:[],
        obj: new Node(fullPath.replace(/^\//, ''))
      };
    }
    if (parts.length == 1) {
      cMap[parts[0]].obj.name = parts[0];
    } else {
      let dir = parts.shift();
      let rest = parts.join('/');
      cMap[dir].paths.push(rest);
    }
  });
  let keys = Object.keys(cMap);
  keys.sort();
  keys.forEach(key => {
    fill(cMap[key].obj, cMap[key].paths)
    node.children.push(cMap[key].obj);
  });
  return node;
}


export default function treeifyPaths (paths: string[] = []): Node {
  return fill(new Node, paths);
}

