const moment = require("moment")

const DATE_FORMAT = "YYYY-MM-DD-hh-mm";

exports.use = (ctx, cb) => {
    ctx.formattedDate = moment().format(DATE_FORMAT)
    ctx.header("Content-Type", "text/csv")
    cb()
}
