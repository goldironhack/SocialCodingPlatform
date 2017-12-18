const deffy = require("deffy")

const CommentSchema = new Bloggify.db.Schema({
    author: {
        type: String,
        index: true
    },
    body: {
        type: String,
        text: true
    },
    created_at: {
        type: Date,
        index: true
    },
    topic: {
        type: String,
        index: true
    },
    votes: [String]
})

// Hooks
CommentSchema.pre("save", function (next) {
    this.wasNew = this.isNew
    next()
})

CommentSchema.post("save", function () {
    if (this.wasNew) {
        Bloggify.emit("comment:created", this)
    }
})

// Create comment
CommentSchema.statics.createComment = data => {
    data.body = deffy(data.body, "").trim()
    data.votes = []
    if (!data.body.length) {
        return Promise.reject(Bloggify.errors.COMMENT_BODY_IS_BLANK())
    }
    return new Comment(data).save()
}

// Get comment
CommentSchema.statics.getComment = filters => {
    return Comment.findOne(filters)
}

// Query comments
CommentSchema.statics.queryComments = opts => {
    opts = opts || {}
    let topics = []
    return Comment.find(opts.filters, opts.fields).sort({
        created_at: 1
    }).exec()
}

const Comment = module.exports = Bloggify.db.model("Comment", CommentSchema)
