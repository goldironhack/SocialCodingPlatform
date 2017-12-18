const userIndex = require("../_")

exports.before = (ctx, cb) => {
    ctx.next()
}

// This functionality is disabled
//exports.get = ctx => {
//    return ctx.next()
//    const user = Bloggify.services.session.getUser(ctx)
//    if (!user) { return ctx.next(); }
//    return userIndex.get(ctx).then(data => {
//        let profile = data.profile
//        if (!profile || profile._id.toString() !== user._id) {
//            return ctx.next()
//        }
//        return {
//            profile: profile
//        }
//    })
//}
//
//exports.post = ctx => {
//    return ctx.next()
//
//    const user = ctx.user
//    const updateData = {
//        bio: ctx.data.bio
//      , twitter: ctx.data.twitter
//      , website: ctx.data.website
//    }
//
//    return Bloggify.models.User.updateUser({
//        _id: user._id
//    }, {
//        profile: updateData
//    }).then(() => {
//        ctx.redirect(data.profile_url)
//        return false
//    })
//}
