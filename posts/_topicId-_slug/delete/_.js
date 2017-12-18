exports.post = ctx => {
    const user = ctx.user;
    const filters = {
        _id: ctx.params.topicId
    };

    if (!Bloggify.services.session.isAdmin(user)) {
         filters.author = user._id;
    }

    return Bloggify.models.Topic.remove(filters).then(() => {
        ctx.redirect("/");
        return false
    })
};
