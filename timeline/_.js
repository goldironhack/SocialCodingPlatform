module.exports = ctx => {
    const HackTypes = Bloggify.services.hack_types
    return {
        user: ctx.user,
        hackType: HackTypes[ctx.user.profile.hack_type]
    };
};
