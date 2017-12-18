"use strict"

const paths2tree = require("../lib")

console.log(paths2tree([
    "index.html",
    "README.md",
    "assets/css/style.css",
    "assets/js/index.css",
    "images/background/1.png",
    "images/background/2.png"
]))
// {
//     "path": "",
//     "name": "",
//     "children": [{
//         "path": "/README.md",
//         "name": "README.md",
//         "children": []
//     }, {
//         "path": "/assets",
//         "name": "assets",
//         "children": [{
//             "path": "/assets/css",
//             "name": "css",
//             "children": [{
//                 "path": "/assets/css/style.css",
//                 "name": "style.css",
//                 "children": []
//             }]
//         }, {
//             "path": "/assets/js",
//             "name": "js",
//             "children": [{
//                 "path": "/assets/js/index.css",
//                 "name": "index.css",
//                 "children": []
//             }]
//         }]
//     }, {
//         "path": "/images",
//         "name": "images",
//         "children": [{
//             "path": "/images/background",
//             "name": "background",
//             "children": [{
//                 "path": "/images/background/1.png",
//                 "name": "1.png",
//                 "children": []
//             }, {
//                 "path": "/images/background/2.png",
//                 "name": "2.png",
//                 "children": []
//             }]
//         }]
//     }, {
//         "path": "/index.html",
//         "name": "index.html",
//         "children": []
//     }]
// }

// Custom separator, also with a custom handler called on node creation
let i = 0
console.log(paths2tree([
    "a",
    "a|b|c|d|e|f",
], "|", node => {
    node.id = ++i
}))
// {
//     "path": "",
//     "name": "",
//     "children": [{
//         "path": "|a",
//         "name": "a",
//         "children": [{
//             "path": "|a|b",
//             "name": "b",
//             "children": [{
//                 "path": "|a|b|c",
//                 "name": "c",
//                 "children": [{
//                     "path": "|a|b|c|d",
//                     "name": "d",
//                     "children": [{
//                         "path": "|a|b|c|d|e",
//                         "name": "e",
//                         "children": [{
//                             "path": "|a|b|c|d|e|f",
//                             "name": "f",
//                             "children": [],
//                             "id": 7
//                         }],
//                         "id": 6
//                     }],
//                     "id": 5
//                 }],
//                 "id": 4
//             }],
//             "id": 3
//         }],
//         "id": 2
//     }],
//     "id": 1
// }
