exports.use = (ctx, cb) => {
    if (!ctx.isProjectOwner) {
        return ctx.redirect("/")
    }
    cb()
}

exports.post = ctx => {
    return ctx.selected_project.destroyProject().then(() => {
        ctx.redirect(`/users/${ctx.user.username}/projects`)
        return false
    })
}
