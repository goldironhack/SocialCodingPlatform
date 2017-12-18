exports.get = ctx => {
    ctx.redirect(ctx.url.href.split("/").slice(0, -1).join("/"))
    return false
}

exports.post = ctx => {
    const user = ctx.user
    return Bloggify.models.Topic.toggleVote({
        user: user,
        topic: ctx.params.topicId
    }).then(() => {
        ctx.redirect(ctx.url.href.split("/").slice(0, -1).join("/"))
        return false
    })
}
