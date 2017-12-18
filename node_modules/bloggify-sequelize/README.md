
# bloggify-sequelize

 [![Version](https://img.shields.io/npm/v/bloggify-sequelize.svg)](https://www.npmjs.com/package/bloggify-sequelize) [![Downloads](https://img.shields.io/npm/dt/bloggify-sequelize.svg)](https://www.npmjs.com/package/bloggify-sequelize)

> Use Sequelize in Bloggify applications.

## :cloud: Installation

```sh
$ npm i --save bloggify-sequelize
```


## :memo: Documentation


### bloggify:init

#### Params
- **Object** `config`:
   - `uri` (String): The database uri (if this is used, the other config fields will be ignored).
   - `db_name` (String): The database name
   - `username` (Object): The database username.
   - `password` (Object): The database password.
   - `options` (Object): The database options.
   - `models_dir` (String): The relative path to a directory containing models stored in files.

The model objects can be accessed by requiring the module or accessing the `Bloggify.models` object.

After the module is initialized, the `db` field is appended to the Sequelize module, being the Sequelize instance.
You can access the Sequelize instance using:

```js
const seq = require("sequelize").db
```



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify`](https://github.com/Bloggify/Bloggify) (by Bloggify)—We make publishing easy.

## :scroll: License

[MIT][license] © [Bloggify][website]

[license]: http://showalicense.com/?fullname=Bloggify%20%3Csupport%40bloggify.org%3E%20(https%3A%2F%2Fbloggify.org)&year=2017#license-mit
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
