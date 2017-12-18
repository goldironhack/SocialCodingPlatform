exports.before = ctx => {
    return Bloggify.services.session.onlyAuthenticated(ctx)
}

exports.insert = ctx => {
    const user = ctx.user
    const ev = {
        actor: user._id,
        event: ctx.data.event,
        metadata: ctx.data.metadata || {}
    }

    ev.metadata.user_agent = ctx.header("user-agent")

    return Bloggify.services.tracking.record(user, ev)
}


const TrackingWS = Bloggify.actions.ws("tracking", [
    (socket, next) => {
        Bloggify.server.session(socket.handshake, {}, next)
    },
    (socket, next) => {
        socket.user = Object(socket.handshake.session._sessionData).user
        if (!socket.user) {
            return next(new Error("You are not authenticated."))
        }
        next()
    }
])

TrackingWS.on("connect", socket => {
    const openPageDate = new Date()
        , ctx = socket.handshake
        , user = socket.user
        , url = Bloggify.services.crypto.decrypt(ctx.headers.referer.split("/").slice(-1)[0])
    
    if (!url) {
        return
    }
    
    socket.on("disconnect", () => {
        const closePageDate = new Date()
            , ev = {
                actor: user._id,
                event: "view-project-time",
                metadata: {
                    url,
                    time_open: (closePageDate - openPageDate) / 1000,
                    user_agent: ctx.headers["user-agent"]
                }
              }
        Bloggify.services.tracking.record(user, ev)
    })
})