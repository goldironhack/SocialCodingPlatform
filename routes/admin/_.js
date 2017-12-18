const forEach = require("iterate-object");

exports.before = (ctx, cb) => {
    const dbUser = ctx.user;
    if (Bloggify.services.session.isAdmin(dbUser)) {
        return cb()
    }
    ctx.redirect("/");
}

exports.get = ctx => {
    const data = {}
    return Bloggify.models.Settings.getSettings().then(options => {
        data.settings = options.settings
        return Bloggify.models.User.find({}, {
            password: 0
        })
    }).then(users => {
        users = users.map(c => c.toObject());
        return {
            users: users
          , settings: data.settings
        }
    })
}

exports.post = ctx => {
    const deleteUserId = ctx.data["delete-user-id"];

    // Delete user
    if (deleteUserId) {
        return Bloggify.models.User.removeUser(deleteUserId).then(() => {
            ctx.redirect("/admin");
            return false
        });
    }

    if (!ctx.data.hack_types) {
        ctx.redirect("/admin");
        return false
    }

    let foundInvalidDate = false;
    forEach(ctx.data.hack_types, hType => {
        hType.start_date = new Date(hType.start_date);
        hType.hack_start_date = new Date(hType.hack_start_date);
        hType.next_phase_date = new Date(hType.next_phase_date);
        hType.show_results_date = new Date(hType.show_results_date);
        if (isNaN(hType.start_date) || isNaN(hType.hack_start_date) || isNaN(hType.next_phase_date) || isNaN(hType.show_results_date)) {
            foundInvalidDate = true;
        }
    });

    if (foundInvalidDate) {
        ctx.apiError(new Error("Invalid date. Make sure the format is correct."));
        return false;
    }

    return Bloggify.models.Settings.setSettings({
        hack_types: ctx.data.hack_types
    }).then(() => {
        return Promise.all(ctx.data.users.map(c => {
            const roleValue = c.update.role;
            delete ctx.data.role;
            return Bloggify.models.User.updateUser({
                _id: c._id
            }, {
                role: roleValue,
                profile: {
                    [ctx.data.hack_types[c.hack_type].phase]: {
                        "project_url": c.update.project_url
                      , "github_repo_url": c.update.github_repo_url
                      , "score_technical": +c.update.score_technical || 0
                      , "score_info_viz": +c.update.score_info_viz || 0
                      , "score_novelty": +c.update.score_novelty || 0
                      , "score_custom": c.update.score_custom && +c.update.score_custom
                      , "score_total": +c.update.score_total || 0
                    }
                }
            });
        }))
    }).then(c => {
        ctx.redirect("/admin");
        return false
    });
};
