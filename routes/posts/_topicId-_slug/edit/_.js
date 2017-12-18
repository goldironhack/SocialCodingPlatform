const getTopic = require("../_")

exports.get = ctx => {
    const user = ctx.user
    return getTopic(ctx).then(data => {
        if (data.topic.author._id.toString() === user._id.toString() || Bloggify.services.session.isAdmin(user)) {
            return data
        }
        ctx.next()
        return false
    })
}

exports.post = ctx => {
   const user = ctx.user
   const filters = {
      _id: ctx.params.topicId
   }

   if (!Bloggify.services.session.isAdmin(user)) {
        filters.author = user._id
        delete ctx.data.sticky
   } else {
        ctx.data.sticky = !!ctx.data.sticky
   }

   return Bloggify.models.Topic.update(filters, ctx.data).then(topic => {
       ctx.redirect(topic.url)
       return false
   })
}
