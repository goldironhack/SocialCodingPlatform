// Select the user for all the routes under /:user
exports.use = (ctx, cb) => {
    Bloggify.models.User.getUser({
        filters: {
            username: ctx.params.user
        }
      , fields: {
            password: 0
        }
    }).then(user => {
        if (!user) {
            return ctx.next();
        }
        user = user.toObject();
        ctx.selected_user = user;
        cb();
    }).catch(err => cb(err))
};

exports.get = ctx => {
    const authUser = Bloggify.services.session.getUser(ctx);
    if (!authUser) {
        return ctx.next();
    }

    return {
        profile: ctx.selected_user
    }
};
