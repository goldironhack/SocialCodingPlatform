
# treeify-paths

[![Build Status](https://travis-ci.org/khtdr/treeify-paths.svg?branch=master)](https://travis-ci.org/khtdr/treeify-paths)
[![NPM version](https://img.shields.io/npm/v/treeify-paths.svg)](https://www.npmjs.com/package/treeify-paths)

Provide a __list of file names__:
  - blog/all.html
  - blog/2036/overflows.html
  
And recieve a __directory-like tree__:
  - blog
      - all.html
      - 2036
          - overflows.html

### Use Cases

Useful when converting a list of file names into a nested UL/LI tree. Nice for site maps, etc.

  - [Live example](https://runkit.com/khtdr/treeify-paths)
  - [Download example](https://runkit.com/downloads/khtdr/treeify-paths/1.0.0.zip)

## Installation:


Install it with NPM:
```bash
npm install --save treeify-paths
```

```javascript
import treeifyPaths from 'treeify-paths';
```

If you are not using NPM, install the library by downloading the [source file](https://raw.githubusercontent.com/khtdr/treeify-paths/master/treeify-paths.js) and including it in your project:
```bash
curl -o treeify-paths.js "https://raw.githubusercontent.com/khtdr/treeify-paths/master/treeify-paths.js"
```
```javascript
let treeify_paths = require('./treeify-paths').default;
```

## Usage:

This module provides a function `treeifyPaths` that takes a list of file names and returns a directory-like tree.


### the following script:
```javascript
import treeifyPaths from 'treeify-paths';
console.log(JSON.stringify(treeifyPaths([
  'about.html',
  'careers',
  'careers/job-1.html',
  'careers/job-2.html',
  'to/some/page.aspx',
]), null, 3);
```

### produces the following output:
```json
{
   "path": "",
   "name": "",
   "children": [
      {
         "path": "about.html",
         "name": "about.html",
         "children": []
      },
      {
         "path": "careers",
         "name": "careers",
         "children": [
            {
               "path": "careers/job-1.html",
               "name": "job-1.html",
               "children": []
            },
            {
               "path": "careers/job-2.html",
               "name": "job-2.html",
               "children": []
            }
         ]
      },
      {
         "path": "to",
         "name": "",
         "children": [
            {
               "path": "to/some",
               "name": "",
               "children": [
                  {
                     "path": "to/some/page.aspx",
                     "name": "page.aspx",
                     "children": []
                  }
               ]
            }
         ]
      }
   ]
}
```


## Testing

The mocha [tests have many examples](./tests.js)

```bash
> treeify-paths@1.0.1 pretest khtdr/treeify-paths
> tsc lib.ts && mv lib.js treeify-paths.js

> treeify-paths@1.0.1 test khtdr/treeify-paths
> mocha tests.js

  treeifyPaths([...arguments])
    arguments: none
      ✓ should return an empty object
    arguments: empty list
      ✓ should return an empty object
    arguments: list with a single file
      ✓ should return a single file
      ✓ should return with nested children
    arguments: multiple file names
      ✓ should return with nested children
      ✓ should alphabetize
      ✓ should ignore duplicates

  7 passing (8ms)
```
