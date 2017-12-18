module.exports = class Session {
    static isAuthenticated (ctx) {
        return Session.getUser(ctx)
    }
    static getUser (ctx) {
        return ctx && ctx.getSessionData("user")
    }
    static isAdmin (user) {
        if (!user || !user.username) {
            user = Session.getUser(user)
        }
        return !!(user && (user.role === "admin" || user.username === process.env.ADMIN_USERNAME))
    }
    static loginUser (user, ctx) {
        ctx.setSessionData({
            user
        })
        const returnTo = ctx.getSessionData("return_to")
        if (returnTo) {
            return ctx.redirect(returnTo)
        }
        ctx.redirect("/")
    }
    static onlyAuthenticated (ctx, shouldBeAdmin) {
        const user = Session.getUser(ctx)
        if (!user || (shouldBeAdmin && !Session.isAdmin(user))) {
            throw Bloggify.errors.NOT_AUTHORIZED()
        }
        return user
    }
}
