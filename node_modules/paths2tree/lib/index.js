"use strict"

class Node {
    constructor (path = "", onNode) {
        this.path = path
        this.name = ''
        this.children = []
        this.onNode = () => onNode && onNode(this)
    }
}

// Based on https://github.com/khtdr/treeify-paths/blob/master/treeify-paths.js
// Thanks!
function fill(node, paths, delimiter, onNode) {
    const cMap = {}

    paths.forEach(file => {
        const parts = file.split(delimiter)

        if (!cMap[parts[0]]) {
            const fullPath = node.path + delimiter + parts[0]
            cMap[parts[0]] = {
                paths: [],
                obj: new Node(fullPath, onNode)
            }
        }

        cMap[parts[0]].obj.name = parts[0]
        if (parts.length !== 1) {
            const dir = parts.shift()
                , rest = parts.join(delimiter)
            cMap[dir].paths.push(rest)
        }
    })

    const keys = Object.keys(cMap)
    keys.sort().forEach(function (key) {
        const parent = cMap[key].obj
        parent.onNode()
        fill(parent, cMap[key].paths, delimiter, onNode)

        const child = cMap[key].obj
        child.onNode()

        node.children.push(child)
    })
    return node
}

/**
 * paths2tree
 * Convert a list of paths into a tree.
 *
 * @name paths2tree
 * @function
 * @param {Number} a Param descrpition.
 * @param {Number} b Param descrpition.
 * @return {Number} Return description.
 */
module.exports = function paths2tree (paths = [], delimiter = "/", onNode) {
    const root = new Node("", onNode)
    root.onNode()
    return fill(root, paths, delimiter, onNode)
}
