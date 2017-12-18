module.exports = ctx => {
    ctx.header(
        "Content-Disposition"
      , `attachment; filename=${ctx.formattedDate}-topics.csv`
    );
    Bloggify.services.exports.topics().pipe(ctx.res);
    return false
}
