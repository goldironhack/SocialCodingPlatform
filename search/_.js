module.exports = ctx => {
    const user = ctx.user;
    const isAdmin = Bloggify.services.session.isAdmin(user);

    // Perform the search query
    if (!ctx.query.search) {
        return
    }

    // Use the $text index to search
    const filters = {
        $text: {
            $search: ctx.query.search
        }
    };
    let results = {};

    // Search in the topics and comments
    return Promise.all([
        Bloggify.models.Topic.find(filters)
      , Bloggify.models.Comment.find(filters)
    ]).then(data => {
        results.topics = data[0];
        results.comments = data[1].map(c => c.toObject());
        return Promise.all(results.comments.map(cComment => {
            return Bloggify.models.Topic.findOne({ _id: cComment.topic });
        }));
    }).then(topics => {
        let uniqueTopics = {};
        results.topics.concat(topics).forEach(c => {
            if (!c) { return; }

            // Let the admin see all the posts/comments in all the forums
            if (!isAdmin) {
                if (c.metadata.hack_type !== user.profile.hack_type ||
                    c.metadata.hack_id !== user.profile.hack_id) {
                    return;
                }
            }
            uniqueTopics[c._id] = c;
        });

        return {
            results: Object.keys(uniqueTopics).map(k => uniqueTopics[k])
        }
    });
};
