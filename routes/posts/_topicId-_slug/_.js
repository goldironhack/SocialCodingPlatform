module.exports = ctx => {
    const user = ctx.user

    const filters = {
        _id: ctx.params.topicId
    };

    if (!Bloggify.services.session.isAdmin(user)) {
        filters["metadata.hack_type"] = user.profile.hack_type
        filters["metadata.hack_id"] = user.profile.hack_id
    }

    return Bloggify.models.Topic.getTopic(filters).then(topic => {
        if (topic.slug !== ctx.params.slug) {
            ctx.redirect(topic.url);
            return false;
        }
        return Bloggify.models.Topic.populateTopic(topic.toObject()).then(topic => ({
            topic
        }))
    })
}