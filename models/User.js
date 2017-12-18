const ul = require("ul")
    , regexEscape = require("regex-escape")
    , deffy = require("deffy")


const UserSchema = new Bloggify.db.Schema({
    username: {
        type: String,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    password: String,
    profile: Object,
    role: String
})

UserSchema.virtual("profile_url").get(function () {
    return `/users/${this.username}`
})

UserSchema.statics.getUser = data => {
    if (data.filters) {
        return User.findOne(data.filters, data.fields)
    }

    const $or = []
    if (data.email) {
        $or.push({ email: data.email })
    }

    if (data.username) {
        $or.push({
            username: new RegExp("^" + regexEscape(data.username) + "$", "i")
        })
    }

    return User.findOne({
        $or: $or
    })
}

UserSchema.statics.createUser = data => {
    return User.findOne({
        $or: [
            { username: data.username },
            { email: data.email }
        ]
    }).then(existingUser => {
        if (existingUser) {
            // throw new Error("Email/username is already registered.")
            return existingUser
        }

        const HACK_TYPES = Bloggify.services.hack_types
            , now = new Date()
            , hType = HACK_TYPES[data.profile.hack_type]
            , create = () => new User(data).save()

        if (now > hType.start_date) {
            return hType.getHackId().then(id => {
                data.profile.hack_id = id
                return create()
            })
        }

        data.profile.hack_id = null
        return create()
    })
}

UserSchema.statics.updateUser = (filters, data) => {
    return User.findOne(filters).then(user => {
        if (!user) {
            throw new Error("User not found.");
        }
        let update = ul.deepMerge(data, user.toObject());
        delete update._id;
        user.set(update);
        return user.save();
    });
}

UserSchema.statics.createTopic = data => {
    const Topic = Bloggify.models.Topic;
    return new Topic(data).save()
}

UserSchema.statics.removeUser = userId => {
    userId = deffy(userId, "");
    if (!userId) {
        return Promise.reject(Bloggify.errors.INVALID_USER_ID())
    }

    // Delete user
    return User.remove({
        _id: userId
    }).then(() => {
        // Delete comments
        return Bloggify.models.Topic.remove({
            author: userId
        })
    }).then(() => {
        // Delete posts
        return Bloggify.models.Comment.remove({
            author: userId
        });
    }).then(() =>
        ({ success: true })
    )
}

UserSchema.statics.auth = data => {
    return User.getUser(data).then(user => {
        if (!user) { throw Bloggify.errors.USER_NOT_FOUND() }
        if (user.password !== data.password) {
            throw Bloggify.errors.INVALID_PASSWORD()
        }
        return user
    })
}

UserSchema.pre("save", function (next) {
    const phases = ["phase1", "phase2", "phase3", "phase4"]
    phases.forEach(cPhase => {
        const phaseObj = Object(this.profile[cPhase])
        this.set(`profile.${cPhase}.project_url`, deffy(phaseObj.project_url, ""))
        this.set(`profile.${cPhase}.github_repo_url`, deffy(phaseObj.github_repo_url, ""))
        this.set(`profile.${cPhase}.score_technical`, deffy(phaseObj.score_technical, 0))
        this.set(`profile.${cPhase}.score_info_viz`, deffy(phaseObj.score_info_viz, 0))
        this.set(`profile.${cPhase}.score_novelty`, deffy(phaseObj.score_novelty, 0))
        this.set(`profile.${cPhase}.score_total`, deffy(phaseObj.score_total, 0))
    })
    next()
})

const User = module.exports = Bloggify.db.model("User", UserSchema)
