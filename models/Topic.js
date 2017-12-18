const slug = require("slugo")
    , deffy = require("deffy")

const USER_FIELDS = {
    password: 0
}

const TopicSchema = new Bloggify.db.Schema({
    author: {
        type: String,
        index: true
    },
    title: {
        type: String,
        text: true
    },
    slug: {
        type: String,
        index: true
    },
    body: {
        type: String,
        text: true
    },
    created_at: Date,
    votes: [String],
    sticky: Boolean,
    metadata: Object,
    hidden: Boolean
}, {
    toObject: {
      virtuals: true
    }
})

TopicSchema.virtual("url").get(function () {
    return `/posts/${this._id}-${this.slug}`
})

// Hooks
TopicSchema.pre("save", function (next) {
    this.set("title", deffy(this.title, "").trim())
    this.set("body", deffy(this.body, "").trim())
    if (!this.title.length) {
        return next(Bloggify.errors.TOPIC_TITLE_IS_EMPTY())
    }
    if (!this.body.length) {
        return next(Bloggify.errors.TOPIC_BODY_IS_EMPTY())
    }
    this.set("slug", slug(this.title))
    this.wasNew = this.isNew
    next()
})

TopicSchema.post("save", function () {
    const topic = this
    if (topic.wasNew) {
        Topic.emitTopicCreated(topic._id)
    } else {
        Topic.emitTopicUpdated(topic._id)
    }
})

// Statics
TopicSchema.statics.create = data => {
    data.sticky = !!data.sticky
    return new Topic(data).save()
}

TopicSchema.statics.populateTopic = (item, options) => {

    if (Array.isArray(item)) {
        return Promise.all(item.map(c => Topic.populateTopic(c, options)))
    }

    options = options || {}
    options.userFields = options.userFields || USER_FIELDS

    return Promise.all([
        Bloggify.models.User.getUser({
            filters: { _id: item.author },
            fields: options.userFields
        })
      , Topic.getComments(item, options)
    ]).then(data => {
        item.author = data[0]
        item.comments = data[1]
        item.metadata.hack_label = Object(Bloggify.models.Settings.HACK_TYPES[item.metadata.hack_type]).label
        return item
    })
}

TopicSchema.statics.getComments = (item, opts) => {
    opts = opts || {}
    opts.userFields = opts.userFields || USER_FIELDS
    return Bloggify.models.Comment.queryComments({
        filters: {
            topic: item._id
        }
    }).then(comments => {
        return Promise.all(comments.map(comment => {
            return Bloggify.models.User.getUser({
                filters: { _id: comment.author },
                fields: opts.userFields
            }).then(author => {
                comment = comment.toObject()
                comment.author = author.toObject()
                return comment
            })
        }))
    })
}

TopicSchema.statics.update = (filters, data) => {
    return Topic.getTopic(filters).then(topic => {
        if (data.sticky === undefined) {
            data.sticky = topic.sticky
        }
        return topic.set(data).save()
    })
}

TopicSchema.statics.getTopic = filters => {
    return Topic.findOne(filters).then(topic => {
        if (!topic) {
            throw Bloggify.errors.POST_NOT_FOUND()
        }
        return topic
    })
}

TopicSchema.statics.getMore = opts => {
    opts = opts || {}
    //opts.limit = opts.limit || 5
    let topics = []
    return Topic.find(opts.filters, opts.fields).limit(opts.limit).sort({
        created_at: -1
    }).then(data => {
        topics = data.map(c => c.toObject())
        return Topic.populateTopic(topics, {
            userFields: {
                "profile.commits": 0,
                "email": 0,
                "password": 0
            }
        })
    })
}

TopicSchema.statics.getPopulated = (id, opts) => {
   return Topic.getTopic({
      _id: id
   }).then(topic => {
       return Topic.populateTopic(topic.toObject(), opts)
   })
}

TopicSchema.statics.emitTopicCreated = id => {
    return Topic.getPopulated({
        _id: id
    }).then(topic => {
        process.nextTick(() =>
            Bloggify.emit("topic:created", topic)
        )
    })
}

TopicSchema.statics.emitTopicUpdated = (id) => {
    return Topic.getPopulated({
        _id: id
    }).then(topic => {
        process.nextTick(() =>
            Bloggify.emit("topic:updated", topic)
        )
    })
}

TopicSchema.statics.postComment = data => {
    data.votes = 0
    data.created_at = new Date()
    return Bloggify.models.Comment.createComment(data).then(comment => {
        return Topic.emitTopicUpdated(data.topic)
    })
}

TopicSchema.statics.toggleVote = data => {
    const filters = {
        _id: data.topic
    }

    if (!Bloggify.services.session.isAdmin(data.user)) {
        filters["metadata.hack_type"] = data.user.profile.hack_type
        filters["metadata.hack_id"] = data.user.profile.hack_id
    }

    return Topic.getTopic(filters).then(topic => {
        const votes = topic.toObject().votes
        if (votes.includes(data.user._id.toString())) {
            votes.splice(votes.indexOf(data.user._id), 1)
        } else {
            votes.push(data.user._id.toString())
        }
        topic.set("votes", votes)
        return topic.save()
    })
}

TopicSchema.statics.updateComment = (filters, commentBody) => {
    commentBody = deffy(commentBody, "").trim()
    if (!commentBody) {
        return Promise.reject(Bloggify.errors.COMMENT_BODY_IS_BLANK())
    }
    const data = {}
    return Bloggify.models.Comment.getComment(filters).then(comment => {
        data.comment = comment
        comment.set("body", commentBody)
        return comment.save()
    }).then(() => {
        Topic.emitTopicUpdated(data.comment.topic)
    })
}

TopicSchema.statics.deleteComment = filters => {
    return Bloggify.models.Comment.remove(filters)
}

TopicSchema.statics.toggleCommentVote = data => {
    return Bloggify.models.Comment.getComment({
        _id: data.comment
    }).then(comment => {
        const votes = comment.toObject().votes
        if (votes.includes(data.user.toString())) {
            votes.splice(votes.indexOf(data.user), 1)
        } else {
            votes.push(data.user.toString())
        }
        data.comment = comment
        comment.set("votes", votes)
        return comment.save()
    }).then(c => {
        Topic.emitTopicUpdated(data.comment.topic)
    })
}

const Topic = module.exports = Bloggify.db.model("Topic", TopicSchema)
