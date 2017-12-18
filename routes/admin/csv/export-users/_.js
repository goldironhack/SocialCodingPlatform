module.exports = ctx => {
    const hackType = ctx.query.hackType
        , hackId = ctx.query.hackId
        ;

    ctx.header(
        "Content-Disposition"
      , `attachment; filename=users-${ctx.formattedDate}${hackType ? "-" + hackType : ""}${hackId ? "-" + hackId : hackId}.csv`
    );

    Bloggify.services.exports.users({
        hackType: hackType
      , hackId: +hackId
    }, ctx.query.exportType).pipe(ctx.res);

    return false
}
