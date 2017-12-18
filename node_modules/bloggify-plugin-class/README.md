
# bloggify-plugin-class

 [![Version](https://img.shields.io/npm/v/bloggify-plugin-class.svg)](https://www.npmjs.com/package/bloggify-plugin-class) [![Downloads](https://img.shields.io/npm/dt/bloggify-plugin-class.svg)](https://www.npmjs.com/package/bloggify-plugin-class)

> A library for managing plugin objects.

This module is used internally in plugin loaders.

## :cloud: Installation

```sh
$ npm i --save bloggify-plugin-class
```


## :clipboard: Example



```js
const BloggifyPluginClass = require("bloggify-plugin-class");

// Create a new plugin
let myPlugin = new BloggifyPlugin(
    "foo"
  , "path/to/foo"
);

// And initialize it
myPlugin.init((err, data) => {
    // Do something after initialization
    // ...
});
```

## :question: Get Help

There are few ways to get help:

 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:
 3. For direct and quick help from me, you can [use Codementor](https://www.codementor.io/johnnyb). :rocket:


## :memo: Documentation


### `BloggifyPlugin(name, pluginPath, bloggifyInstance)`
Creates a new Bloggify plugin instance.

#### Params
- **String** `name`: The plugin name.
- **String** `pluginPath`: The plugin path.
- **Bloggify** `bloggifyInstance`: The Bloggify instance.

#### Return
- **BloggifyPlugin** The `BloggifyPlugin` instance containing:
 - `name` (String): The plugin's name.
 - `path` (String): The path to the plugin's directory.
 - `packagePath` (String): The path to the plugin's `package.json` file.
 - `bloggify` (Bloggify): The `Bloggify` instance.
 - `config` (Object): The plugin's configuration.

getFilePath
Returns the path of the searched file.

#### Params
- **String** `fileName`: The name of the file who's path is being searched.

#### Return
- **String** The file's path.

init
Initializes the plugin.

#### Params
- **Function** `cb`: The callback function.

getConfig
Returns plugin's configuration.

#### Return
- **Object** The configuration content.

getPackage
Returns the plugin's package file.

#### Params
- **Function** `cb`: The callback function.

#### Return
- **Object** The package contents.



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify-plugin-loader`](https://github.com/Bloggify/plugin-loader#readme) (by Bloggify)—The Bloggify plugin loader.

## :scroll: License

[MIT][license] © [Bloggify][website]

[license]: http://showalicense.com/?fullname=Bloggify%20%3Csupport%40bloggify.org%3E%20(https%3A%2F%2Fbloggify.org)&year=2016#license-mit
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
