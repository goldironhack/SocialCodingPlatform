"use strict";
var Node = (function () {
    function Node(path) {
        if (path === void 0) { path = ''; }
        this.path = path;
        this.name = '';
        this.children = [];
    }
    return Node;
}());
exports.Node = Node;
;
function fill(node, paths) {
    var cMap = {};
    paths.forEach(function (file) {
        var parts = file.split('/');
        if (!cMap[parts[0]]) {
            var fullPath = node.path + '/' + parts[0];
            cMap[parts[0]] = {
                paths: [],
                obj: new Node(fullPath.replace(/^\//, ''))
            };
        }
        if (parts.length == 1) {
            cMap[parts[0]].obj.name = parts[0];
        }
        else {
            var dir = parts.shift();
            var rest = parts.join('/');
            cMap[dir].paths.push(rest);
        }
    });
    var keys = Object.keys(cMap);
    keys.sort();
    keys.forEach(function (key) {
        fill(cMap[key].obj, cMap[key].paths);
        node.children.push(cMap[key].obj);
    });
    return node;
}
function treeifyPaths(paths) {
    if (paths === void 0) { paths = []; }
    return fill(new Node, paths);
}
exports.__esModule = true;
exports["default"] = treeifyPaths;
