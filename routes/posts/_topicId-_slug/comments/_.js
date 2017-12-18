exports.get = ctx => {
    ctx.redirect(ctx.url.href.split("/").slice(0, -1).join("/"))
}

exports.post = ctx => {
    const user = ctx.user

    // Delete comment
    if (ctx.data.delete_comment_id) {

        const filters = {
            _id: ctx.data.delete_comment_id
        }

        if (!Bloggify.services.session.isAdmin(user)) {
            filters.author = user._id
        }

        return Bloggify.models.Topic.deleteComment(filters).then(data => {
            Bloggify.models.Topic.emitTopicUpdated(ctx.params.topicId)
            ctx.apiMsg("success")
            return false
        })
    }

    // Update comment
    if (ctx.data.update_comment_id) {

        const filters = {
            _id: ctx.data.update_comment_id
        }

        if (!Bloggify.services.session.isAdmin(user)) {
            filters.author = user._id
        }

        return Bloggify.models.Topic.updateComment(filters, ctx.data.body).then(data => {
            ctx.redirect(ctx.url.href.split("/").slice(0, -1).join("/"))
            return false
        })
    }

    // Toggle vote
    if (ctx.data.toggleVote) {
        return Bloggify.models.Topic.toggleCommentVote({
            user: user._id,
            comment: ctx.data.comment
        }).then(data => {
            return {}
        })
    }

    // Post comment
    return Bloggify.models.Topic.postComment({
        author: user._id,
        body: ctx.data.body,
        topic: ctx.params.topicId
    }).then(data => {
        ctx.redirect(ctx.url.href.split("/").slice(0, -1).join("/"))
        return false
    })
}
