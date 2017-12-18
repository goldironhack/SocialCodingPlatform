const paths2tree = require("paths2tree")
    , forEach = require("iterate-object")
    , sameTime = require("same-time")
    , bindy = require("bindy")
    , { buildFilePath, s3, S3_BUCKET, PATH_PPROJECTS } = require("../common/aws-s3")
    , util = require("util")
    , AwsFsCache = require("../common/s3-cache")
    , setTimeoutAsync = duration => {
        return new Promise(res => {
            setTimeout(res, duration)
        })
      }

exports.before = (ctx, actionName) => {
    const user = Bloggify.services.session.onlyAuthenticated(ctx)
    if (ctx.data && !["getFile", "listFiles"].includes(actionName)) {
        ctx.data.username = user.username
    }
}

exports.saveFile = ["post", ctx => {
    const params = {
        Bucket: S3_BUCKET,
        Key: buildFilePath(ctx.data),
        Body: ctx.data.content
    }

    s3.putObjectAsync(params).catch(err => Bloggify.log(err))
    return AwsFsCache.saveFile(params.Key, params.Body)
}]

exports.deleteFile = ["post", ctx => {
    if (ctx.data.filepath === "index.html") {
        throw Bloggify.errors.FILE_SHOULD_NOT_BE_DELETED(ctx.data.filepath)
    }

    const params = {
        Bucket: S3_BUCKET,
        Key: buildFilePath(ctx.data)
    }

    AwsFsCache.deleteFile(params.Key).catch(err => Bloggify.log(err))
    return s3.deleteObjectAsync(params)
}]

exports.getFile = ["post", ctx => {

    const params = {
        Bucket: S3_BUCKET,
        Key: buildFilePath(ctx.data)
    }

    return AwsFsCache.getFile(params.Key).then(cont => {
        if (!cont) {
            return s3.getObjectAsync(params).then(data => {
                data.Body = data.Body.toString("utf-8")
                AwsFsCache.saveFile(params.Key, data.Body).catch(err => Bloggify.log(err))
                return data
            })
        }
        AwsFsCache.saveFile(params.Key, cont)
        return { Body: cont }
    })
}]

exports.listFiles = ["post", ctx => {
    const data = ctx.data
    const params = {
      Bucket: S3_BUCKET,
      Prefix: `${PATH_PPROJECTS}/${data.username}/${data.project_name}/`
    }
    return s3.listObjectsAsync(params).then(data => {
        const files = data.Contents.map(c => c.Key.split("/").slice(2).join("/"))
        let id = 0
        const tree = paths2tree(files, "/", node => {
            node.id = ++id
            node.filename = node.name
            if (node.filename === "index.html") {
                node.deletable = false
            }
            node.toggled = true
            setTimeout(() => {
                if (node.children && !node.children.length) {
                    delete node.children
                }
            })
        })
        return setTimeoutAsync(0).then(() => tree)
    }).then(tree => {
        return (tree.children || [{}])[0]
    })
}]

exports.commit = ["post", ctx => {
    return Bloggify.models.Project.findOne({
        username: ctx.user.username,
        name: ctx.data.project_name
    }).then(project => {
        if (!project) {
            throw Bloggify.errors.PROJECT_NOT_FOUND()
        }
        return project.syncGitHubRepository(ctx.data.commit_message)
    })
}]
