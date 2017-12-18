const mapO = require("map-o");

exports.before = (ctx, cb) => {
    const HackTypes = Bloggify.services.hack_types
    const hackTypes = mapO(HackTypes, val => {
        return {
            subforums: val.subforums_count
        };
    }, true);
    ctx.hack_types = HackTypes
    cb()
}

exports.get = ctx => {
    ctx.data = {
        body: "",
        title: ""
    };
};

exports.post = ctx => {
    const user = ctx.user;

    ctx.data.author = user._id;
    ctx.data.created_at = new Date();
    ctx.data.votes = [];

    let hackTypeSlug = user.profile.hack_type
      , hackId = user.profile.hack_id
      ;

    if (Bloggify.services.session.isAdmin(user)) {
        if (ctx.data.hackId) {
            hackId = ctx.data.hackId;
        }
        if (ctx.data.hack_type) {
            hackTypeSlug = ctx.data.hack_type;
        }
    } else {
        delete ctx.data.sticky;
    }

    ctx.data.metadata = {
        hack_type: hackTypeSlug,
        hack_id: +hackId
    };

    return Bloggify.models.User.createTopic(ctx.data).then(topic => {
        ctx.redirect(topic.url);
        return false
    });
};
