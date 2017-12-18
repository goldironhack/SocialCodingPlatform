"use strict"

const streamp = require("streamp")
    , path = require("path")
    , fs = require("fs")

class AwsFsCache {
    static getAbsPath (p) {
        return path.join(AwsFsCache.path, p)
    }
    static getFile(filePath) {
        filePath = AwsFsCache.getAbsPath(filePath)
        return new Promise((res, rej) => {
            fs.readFile(filePath, "utf8", (err, cont) => {
                if (err) {
                    return res(null)
                }
                res(cont)
            })
        })
    }
    static saveFile(filePath, content) {
        filePath = AwsFsCache.getAbsPath(filePath)
        return new Promise((res, rej) => {
            new streamp.writable(filePath).on("close", res).end(content)
        })
    }
    static deleteFile(filePath) {
        filePath = AwsFsCache.getAbsPath(filePath)
        return new Promise((res, rej) => {
            fs.unlink(filePath, () => res())
        })
    }
}
AwsFsCache.path = path.resolve(Bloggify.options.root, "aws-cache")

module.exports = AwsFsCache
