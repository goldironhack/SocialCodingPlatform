
exports.use = (ctx, cb) => {

    const hackType = Bloggify.models.Settings.HACK_TYPES[ctx.user.profile.hack_type]
        , isOwner = ctx.isProjectOwner = ctx.selected_user.username === ctx.user.username

    if (
        // Disable the editor if the forum didn't start yet
        new Date() < hackType.start_date

        // The results page is not yet visible and another user is trying to access the project
        || (new Date() < hackType.show_results_date && !isOwner)
    ) {
        return ctx.redirect("/timeline")
    }

    cb()
}


module.exports = ctx => {
    const Project = Bloggify.models.Project
    return Project.find({
        username: ctx.selected_user.username
    }).then(projects => {
        return { projects }
    })
};
