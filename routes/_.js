const PUBLIC_PAGES = [
    "/",
    "/register",
    "/login",
    "/login-callback"
]

const WHITELISTED_PRIVATE_PAGES = [
    "/timeline",
    "/task",
    "/logout"
]

exports.use = (ctx, cb) => {
    const user = Bloggify.services.session.getUser(ctx)

    if (!user && ctx.pathname.startsWith("/posts")) {
        ctx.setSessionData({
            return_to: ctx.pathname
        });
        return ctx.redirect("/login");
    }

    if (!user && !PUBLIC_PAGES.includes(ctx.pathname) && !ctx.pathname.startsWith("/@/")) {
        return ctx.redirect("/")
    }

    const HackTypes = Bloggify.services.hack_types
        , Session = Bloggify.services.session

    if (!WHITELISTED_PRIVATE_PAGES.includes(ctx.pathname) && user && HackTypes[user.profile.hack_type].start_date > new Date() && !Session.isAdmin(user)) {
        return ctx.redirect("/timeline")
    }

    if (user) {
        return Bloggify.models.User.getUser(user).then(user => {
            ctx.req.session._sessionData.user = user
            ctx.user = user
            process.nextTick(cb)
        }).catch(
            err => cb(err)
        )
    }

    cb()
}
