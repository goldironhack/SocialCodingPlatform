exports.before = ctx => {
    return Bloggify.services.session.onlyAuthenticated(ctx)
}

exports.list = ctx => {
    const user = Bloggify.services.session.getUser(ctx)
    if (!Bloggify.services.session.isAdmin(user)) {
        ctx.query["metadata.hack_type"] = user.profile.hack_type
        ctx.query["metadata.hack_id"] = user.profile.hack_id
    }
    ctx.query.hidden = { $ne: true }
    return Bloggify.services.posts.list(ctx.query)
}
