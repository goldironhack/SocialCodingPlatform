"use strict";

const writeFile = require("fs").writeFileSync
    , icons = require("./selection.json")
    , ajs = require("ajs")
    ;

ajs.renderFile("./index.ajs", icons, (err, res) => {
    if (err) { throw err; }
    writeFile("./index.html", res);
});
