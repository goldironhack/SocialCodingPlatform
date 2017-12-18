
const assert = require('assert');
const treeifyPaths = require('.').default;
const Node = require('.').Node;

function match (value, shape) {
  for (let key in shape) {
    if (key == 'children') {
      assert.equal(value.children.length, shape.children.length, 'child count');
      for (let i=0, max=value.children.length; i<max; i++) {
        match(value.children[i], shape.children[i]);
      }
    } else {
      assert.equal(value[key], shape[key], 'attribute: <' + key + '>');
    }
  }
}

describe('treeifyPaths([...arguments])', () => {

  describe('arguments: none', () => {
    it('should return an empty object', () => {
      match(treeifyPaths(), {
        constructor:Node, children:[]
      });
    });
  });

  describe('arguments: empty list', () => {
    it('should return an empty object', () => {
      match(treeifyPaths([]), {
        constructor:Node, children:[]
      });
    });
  });

  describe('arguments: list with a single file', () => {
    it('should return a single file', () => {
      match(treeifyPaths([ 'index' ]), {
        constructor:Node,
        children:[
          { name: 'index',
            path: 'index',
            constructor:Node
          }
        ]
      });
    });
    it('should return with nested children', () => {
      match(treeifyPaths([ 'path/to/index' ]), {
        constructor:Node,
        children:[{ name: ''
                  , path: 'path'
                  , constructor:Node
                  , children: [{ name: ''
                               , path: 'path/to'
                               , constructor:Node
                               , children: [{ name: 'index'
                                            , path: 'path/to/index'
                                            , constructor:Node
                                            , children: []
                                            }]
                               }]
                  }]
      });
    });
  });

  describe('arguments: multiple file names', () => {
    it('should return with nested children', () => {
      match(treeifyPaths([ 'path', 'path/to/index', 'x/y/z', 'path/here' ]), {
        constructor:Node,
        children:[{ name: 'path'
                  , path: 'path'
                  , constructor:Node
                  , children: [{ name: 'here'
                               , path: 'path/here'
                               , constructor:Node
                               , children:[]
                               },
                               { name: ''
                               , path: 'path/to'
                               , constructor:Node
                               , children: [{ name: 'index'
                                            , path: 'path/to/index'
                                            , constructor:Node
                                            , children: []
                                            }]
                               }]
                  },
                  { name: ''
                  , path: 'x'
                  , constructor:Node
                  , children: [{ name: ''
                               , path: 'x/y'
                               , constructor:Node
                               , children: [{ name: 'z'
                                            , path: 'x/y/z'
                                            , constructor:Node
                                            , children: []
                                            }]
                               }]
                  }]
      });
    });
    it('should alphabetize', () => {
      match(treeifyPaths([ 'd', 'a', 'b/c', 'b/b/b', 'b/a', 'c/d', 'b' ]), {
        constructor:Node,
        children:[{ name: 'a'
                  , path: 'a'
                  , constructor:Node
                  , children: []
                  },
                  { name: 'b'
                  , path: 'b'
                  , constructor:Node
                  , children: [{ name: 'a'
                               , path: 'b/a'
                               , constructor:Node
                               , children: []
                               },
                               { name: ''
                               , path: 'b/b'
                               , constructor:Node
                               , children: [{ name: 'b'
                                            , path: 'b/b/b'
                                            , constructor:Node
                                            , children: []
                                            }]
                               },
                               { name: 'c'
                               , path: 'b/c'
                               , constructor:Node
                               , children: []
                               }]
                  },
                  { name: ''
                  , path: 'c'
                  , constructor:Node
                  , children: [{ name: 'd'
                               , path: 'c/d'
                               , constructor:Node
                               , children: []
                               }]
                  },
                  { name: 'd'
                  , path: 'd'
                  , constructor:Node
                  , children: []
                  }]
      });
    });
    it('should ignore duplicates', () => {
      match(treeifyPaths(['a', 'a', 'a']), {
        constructor:Node,
        children:[{ name: 'a'
                  , path: 'a'
                  , children: []
                  }]
      });
    });
  });


});

