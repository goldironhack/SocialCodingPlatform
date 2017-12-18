var through = require('through2');
var path = require('path');
var chokidar = require('chokidar');
var crypto = require('crypto');
var xtend = require('xtend');
var anymatch = require('anymatch');
var mkdirp = require('mkdirp');
var fs = require('fs');
var writeJSONSync = require('jsonfile').writeFileSync;
var os = require('os');
var tmpdir = os.tmpdir();

module.exports = watchify;
module.exports.args = function() {
  return {
    cache: {}, packageCache: {}, watch: true
  };
}
/**
* Utility method to load our json cache file. Failover to an empty object.
* The native browserify cache object includes the sources. However,
* since parsing large JSON files is extremely slow, it is much more more
* performant to store the source content in their individual cache files,
* and then reconstruct the cache object when reading.
*
* @param cacheFile [String] - full path to the json file
*/
module.exports.getCache = function(cacheFile) {
  try {
    var start = Date.now()
    var f = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
    for (key in f) {
      if (~['_files', '_time', '_transformDeps'].indexOf(key)) {
        continue
      }
      if (f[key].source) {
        f[key].source = fs.readFileSync(f[key].source, 'utf8');
      }
    }
    return f
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return {};
    } else {
      throw err
    }
  }
};

function watchify (b, opts) {
  var wrapStart = Date.now()
  if (!opts) opts = {};
  var watch = typeof opts.watch !== 'undefined' ? opts.watch : module.exports.args().watch;
  var cacheFile = opts.cacheFile;
  var cache = b._options.cache || {};
  if (!cache._files) cache._files = {};
  if (!cache._time) cache._time = {};
  if (!cache._transformDeps) cache._transformDeps = {};
  var invalid = false;
  var pkgcache = b._options.packageCache;
  var delay = typeof opts.delay === 'number' ? opts.delay : 600;
  var changingDeps = {};
  var pending = false;
  var updating = false;

  if (opts.ignoreWatch) {
    var ignored = opts.ignoreWatch !== true
    ? opts.ignoreWatch
    : '**/node_modules/**';
  }

  var wopts = {persistent: true};
  if (opts.poll || typeof opts.poll === 'number') {
    wopts.usePolling = true;
    wopts.interval = opts.poll !== true
    ? opts.poll
    : undefined;
  }

  if (cache) {
    b.on('reset', collect);
    update();
    collect();
  }

  /**
  * Walk through the dependency cache. If any dependency's modification time has changed, or the file has been
  * removed, invalidate the cache and remove the entry.
  *
  * If the file implicitly requires other files due to a transform, invalidate them.
  * If the file is implicitly required as part of a transform, invalidate the files that require it.
  */
  function update() {
    if (Object.keys(cache).length === 3) {
      invalid = true;
      return;
    } else {
      invalid = false;
    }

    var transformDepsInverted = {};
    Object.keys(cache._transformDeps).forEach(function(mfile) {
      cache._transformDeps[mfile].forEach(function(dep) {
        transformDepsInverted[dep] = transformDepsInverted[dep] || [];
        transformDepsInverted[dep].push(mfile);
      });
    });

    Object.keys(cache._time).forEach(function(file) {
      try {
        var stats = fs.statSync(file);
      } catch (err) {}
      if (!stats || cache._time[file] !== stats.mtime.getTime()) {
        // checkShasum is an array of files that we should check based
        // a hash of their contents as well as the mtime. This is useful
        // for files that are often overwritten with the same content
        // but are still part of the bundle (e.g generated view partials)
        if (stats && opts.checkShasum && ~opts.checkShasum.indexOf(file)) {
          cachedSourceHash = shasum(fs.readFileSync(file, 'utf8'))
          realSourceHash = shasum(cache[file].source)
          if (cachedSourceHash == realSourceHash) {
            cache._time[file] = stats.mtime.getTime();
            return;
          }
        }
        b.emit('log', 'Watchify cache: dep updated or removed: ' + file);
        cleanEntry(cache._files[file], file);

        if (transformDepsInverted[file]) {
          transformDepsInverted[file].forEach(function(mfile) {
            cleanEntry(cache._files[mfile], mfile);
          });
        }

        invalid = true;
      }
    });
  }

  function collect () {
    b.pipeline.get('deps').push(through.obj(function(row, enc, next) {
      var file = row.expose ? b._expose[row.id] : row.file;
      cache[file] = {
        source: row.source,
        deps: xtend({}, row.deps)
      };
      try {
        var stats = fs.statSync(file);
      } catch (err) {}
      if (stats) {
        cache._files[file] = file;
        cache._time[file] = stats.mtime.getTime();
      }
      this.push(row);
      next();
    }));
  }

  b.on('file', function (file) {
    watchFile(file);
  });

  b.on('package', function (pkg) {
    var file = path.join(pkg.__dirname, 'package.json');
    watchFile(file);
    if (pkgcache) pkgcache[file] = pkg;
  });

  b.on('reset', reset);
  reset();

  function reset () {
    var time = null;
    var bytes = 0;
    b.pipeline.get('record').on('end', function () {
      time = Date.now();
    });

    b.pipeline.get('wrap').push(through(write, end));
    function write (buf, enc, next) {
      bytes += buf.length;
      this.push(buf);
      next();
    }
    function end () {
      var delta = Date.now() - time;
      b.emit('time', delta);
      b.emit('bytes', bytes);
      b.emit('log', bytes + ' bytes written ('
        + (delta / 1000).toFixed(2) + ' seconds)'
      );
      this.push(null);
    }
  }

  var fwatchers = {};
  var fwatcherFiles = {};
  var ignoredFiles = {};

  b.on('transform', function (tr, mfile) {
    cleanDependencies(mfile);
    tr.on('file', function (dep) {
      cache._transformDeps[mfile] = cache._transformDeps[mfile] || [];
      cache._transformDeps[mfile].push(dep);

      try {
        var stats = fs.statSync(dep);
      } catch (err) {}
      if (stats) {
        cache._files[dep] = dep;
        cache._time[dep] = stats.mtime.getTime();
      }

      watchFile(mfile, dep);
    });
  });

  b.on('bundle', function (bundle) {
    updating = true;
    bundle.on('error', onend);
    bundle.on('end', onend);
    function onend () { updating = false }
  });

  function watchFile (file, dep) {
    if (!watch) return;
    dep = dep || file;
    if (ignored) {
      if (!ignoredFiles.hasOwnProperty(file)) {
        ignoredFiles[file] = anymatch(ignored, file);
      }
      if (ignoredFiles[file]) return;
    }
    if (!fwatchers[file]) fwatchers[file] = [];
    if (!fwatcherFiles[file]) fwatcherFiles[file] = [];
    if (fwatcherFiles[file].indexOf(dep) >= 0) return;

    var w = b._watcher(dep, wopts);
    w.setMaxListeners(0);
    w.on('error', b.emit.bind(b, 'error'));
    w.on('change', function () {
      invalidate(file);
    });
    fwatchers[file].push(w);
    fwatcherFiles[file].push(dep);
  }

  function cleanDependencies(file) {
    if (cache._transformDeps[file]) {
      cache._transformDeps[file].forEach(function(dep) {
        cleanEntry(cache._files[dep], dep);
      });
    }

    delete cache._transformDeps[file];
  }

  function cleanEntry(id, file) {
    delete cache._files[file];
    delete cache._time[file];
    delete cache[id];
    cleanDependencies(file);

    return;
  }

  function invalidate (id) {
    if (cache && cache[id]) {
      cleanEntry(id, cache[id].file);
    }
    invalid = true;
    if (pkgcache) delete pkgcache[id];
    changingDeps[id] = true;
    if (updating) return;

    if (fwatchers[id]) {
      fwatchers[id].forEach(function (w) {
        w.close();
      });
      delete fwatchers[id];
      delete fwatcherFiles[id];
    }

    // wait for the disk/editor to quiet down first:
    if (!pending) setTimeout(function () {
      pending = false;
      depsChanged = Object.keys(changingDeps).length > 0
      if (!updating && depsChanged) {
        b.emit('update', Object.keys(changingDeps));
        changingDeps = {};
      }
    }, delay);
    pending = true;
  }

  function shasum (value) {
    return crypto.createHash('sha1').update(value).digest('hex');
  }

  b.close = function () {
    Object.keys(fwatchers).forEach(function (id) {
      fwatchers[id].forEach(function (w) { w.close() });
    });
  };

  b._watcher = function (file, opts) {
    return chokidar.watch(file, opts);
  };

  /**
  * Write the internal dependency cache to a file on the file system.
  */
  b.write = function() {
    try {
      if (!fs.existsSync(path.dirname(cacheFile))) {
        mkdirp.sync(path.dirname(cacheFile));
      }
      // Takes the source content and writes it to a file. Then
      // replaces the source content with the filepath of that file.
      omitSources = function(key, value) {
        if (key === 'source' && value) {
          hash = shasum(value)
          var sourceCachePath = path.resolve(tmpdir, hash);
          fs.writeFileSync(sourceCachePath, value);
          return sourceCachePath
        }
        return value
      }
      writeJSONSync(cacheFile, cache, {replacer: omitSources});
    } catch (err) {
      b.emit('log', 'Erroring writing cache file ' + err.message);
    }
  }

  // Save the reference to the real `bundle`
  var _bundle = b.bundle;

  /**
  * Override the browserify `bundle` function. We need to intercept the call to see if any bundling is really
  * needed. When the cache is valid, we just return null. If `watch` is true, though, we setup the watchers on all
  * the files in the cache. Otherwise we do the bundling.
  *
  * @param `cb` {Function} - optional callback
  * @returns - either the stream from `_bundle` or `null` if the cache is valid.
  */
  b.bundle = function(cb) {
    if (invalid) {
      invalid = false;
      var args = 'function' === typeof(cb) ? [cb] : [];
      return _bundle.apply(b, args);
    } else {
      if (watch) {
        setImmediate(function() {
          Object.keys(cache).forEach(function(key) {
            if (key !== '_time' && key !== '_files' && key !== '_transformDeps') watchFile(key);
          });

          Object.keys(cache._transformDeps).forEach(function(mfile) {
            cache._transformDeps[mfile].forEach(function(dep) {
              watchFile(mfile, dep);
            });
          });
        });
        // set to true, because we didn't actual bundle anything yet, but want this
        // set for the next `update`
        b._bundled = true;
      }
      if ('function' === typeof(cb)) {
        b.emit('log', 'Cache is still valid');
        cb();
      } else {
        return null;
      }
    }
  };

  return b;
}
