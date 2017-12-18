const qs = require("querystring");

let HACK_TYPE_OPTIONS = null
  , HACK_TYPES = null

Bloggify.ready(() => {
    HACK_TYPES = Bloggify.services.hack_types
    HACK_TYPE_OPTIONS = Object.keys(HACK_TYPES).map(c => {
        let hType = HACK_TYPES[c];
        return {
            value: c
          , label: hType.label
          , survey: hType.survey
        };
    });
})

exports.before = (ctx, cb) => {
    if (ctx.user) {
        return ctx.redirect("/");
    }
    cb()
}

exports.get = ctx => {
    const user = ctx.getSessionData("new_user");
    if (!user) {
        return {
            hTypeOptions: HACK_TYPE_OPTIONS
        }
    }

    const userId = user.password;
    const qsuid = ctx.query.uid;

    if (userId === qsuid) {
        const hType = HACK_TYPES[user.profile.hack_types];
        return Bloggify.models.User.createUser(user).then(newUser => {
            Bloggify.emit("user:registered", newUser);
            ctx.setSessionData({
                new_user: null
              , surveyLink: null
            })
            Bloggify.services.session.loginUser(newUser, ctx)
            return false
        });
    }

    // Take the survey
    const surveyLink = ctx.getSessionData("surveyLink");
    if (user.username && surveyLink) {
        const redirectTo =  `${Bloggify.options.domain}/register?uid=${user.password}`;
        if (process.argv.includes("--bypass-survey")) {
            ctx.redirect(redirectTo);
            return false
        }
        const qsParams = qs.stringify({
            redirect_to: redirectTo
          , user_email: user.email
          , user_id: user._id
        });

        ctx.redirect(
            `${surveyLink}?${qsParams}`
        );
        return false
    }
};

exports.post = ctx => {
    const user = ctx.getSessionData("new_user");

    let hackType = ctx.data.hack_type;
    if (!hackType) {
        return {
            err: "Please select an option."
          , hTypeOptions: HACK_TYPE_OPTIONS
        }
    }

    let selectedHackType = HACK_TYPES[hackType];
    if (!selectedHackType) {
        return {
            err: "Please select a valid option."
          , hTypeOptions: HACK_TYPE_OPTIONS
        };
    }


    let surveyLink = selectedHackType.survey;
    ctx.setSessionData({
        new_user: {
            profile: {
                hack_type: hackType
            }
        }
      , surveyLink: surveyLink
    });

    ctx.redirect("/login");
    return false
};
