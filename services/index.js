const Session = require("./session")
    , idy = require("idy")

// Handle GitHub login
Bloggify.require("github-login", GitHub => {
    GitHub.on("login-error", (err, ctx) => {
        console.error(err)
        ctx.redirect("/")
    })
    GitHub.on("login-success", (token, user, ctx) => {
        Bloggify.models.User.getUser({
            username: user.login,
            email: user.emails[0].email
        }).then(existingUser => {
            if (existingUser) {
                return Bloggify.services.session.loginUser(existingUser, ctx)
            }

            const newUser = new Bloggify.models.User({
                username: user.login,
                email: user.emails[0].email,
                password: idy(),
                profile: {
                    bio: user.bio,
                    website: user.blog,
                    full_name: user.name,
                    picture: user.avatar_url,
                    github_username: user.login,
                    github_id: user.id
                }
            })

            ctx.startSession({
                new_user: newUser.toObject()
            })

            ctx.redirect("/register")
        }).catch(err => {
            Bloggify.log(err)
            return ctx.redirect("/")
        })
    })
})

process.on("unhandledRejection", err => console.error(err.stack))