


var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);

    var route = document.querySelector('.route');

    app.router.add('', function () {
      location.hash = '#/report';
    });

    app.router.add('report', function (r) {
      console.log('on report');
      
      route.textContent = 'report';
      var data = {
        message: 'report',
        timeout: 2000
      };
      app.snackbar.showSnackbar(data);

    });

    app.router.add('report/:id', function (r) {
      console.log('on report/:id | id=',  r.params.id );

      route.textContent = 'report/:id | id=' + r.params.id;
      var data = {
        message: 'report/:id | id=' + r.params.id,
        timeout: 2000
      };
      app.snackbar.showSnackbar(data);

    });

    app.router.add('index', function (r) {
      console.log('on index');
      
      route.textContent = 'index';
      var data = {
        message: 'index',
        timeout: 2000
      };
      app.snackbar.showSnackbar(data);

    });

    app.router.add('.*', function (r) {
      console.log('default', bad);
      
      route.textContent = 'default';
      var data = {
        message: 'Нечего расчитывать',
        timeout: 2000
      };
      app.snackbar.showSnackbar(data);

    });

    function processHash() {
      var hash  = location.hash || '#',
          route = hash.slice(1);

      if ( app.router.exists( route ) ) {
        
        app.router.run( route );
      } else {
        
        route.textContent = 'not exist';
        console.log('not exists');
         var data = {
          message: 'not exist',
          timeout: 2000
        };
        app.snackbar.showSnackbar(data);
        // app.document.event.publish('routeFailedToLoad');
      }
    }

    window.addEventListener('hashchange', processHash);
    processHash();




    var db;
    var databaseName = 'myDB';
    var databaseVersion = 1;
    var openRequest = window.indexedDB.open(databaseName, databaseVersion);
    openRequest.onerror = function (event) {
        console.log(openRequest.errorCode);
    };
    openRequest.onsuccess = function (event) {
        // Database is open and initialized - we're good to proceed.
        db = openRequest.result;
        displayData(db);
    };
    openRequest.onupgradeneeded = function (event) {
        // This is either a newly created database, or a new version number
        // has been submitted to the open() call.
        var db = event.target.result;
        db.onerror = function () {
            console.log(db.errorCode);
        };

        // Create an object store and indexes. A key is a data value used to organize
        // and retrieve values in the object store. The keyPath option identifies where
        // the key is stored. If a key path is specified, the store can only contain
        // JavaScript objects, and each object stored must have a property with the
        // same name as the key path (unless the autoIncrement option is true).
        var store = db.createObjectStore('customers', { keyPath: 'customerId' });

        // Define the indexes we want to use. Objects we add to the store don't need
        // to contain these properties, but they will only appear in the specified
        // index of they do.
        //
        // syntax: store.createIndex(indexName, keyPath[, parameters]);
        //
        // All these values could have duplicates, so set unique to false
        store.createIndex('firstName', 'firstName', { unique: false });
        store.createIndex('lastName', 'lastName', { unique: false });
        store.createIndex('street', 'street', { unique: false });
        store.createIndex('city', 'city', { unique: false });
        store.createIndex('zipCode', 'zipCode', { unique: false });
        store.createIndex('country', 'country', { unique: false });

        // Once the store is created, populate it
        store.transaction.oncomplete = function (event) {
            // The transaction method takes an array of the names of object stores
            // and indexes that will be in the scope of the transaction (or a single
            // string to access a single object store). The transaction will be
            // read-only unless the optional 'readwrite' parameter is specified.
            // It returns a transaction object, which provides an objectStore method
            // to access one of the object stores that are in the scope of this
            //transaction.
            var customerStore = db.transaction('customers', 'readwrite').objectStore('customers');
            customers.forEach(function (customer) {
                customerStore.add(customer);
            });
        };
    };

    function displayData(data) {
      console.log('data', data);
    }

     var trans = db.transaction(['todo'], "readwrite");
    var store = trans.objectStore('todo');
    var data = {
      "text": 'test',
      "timeStamp": new Date().getTime()
    };
    var request = store.put(data);
    request.onsuccess = function(e) {
      todoDB.indexedDB.getAllTodoItems();
    };
    request.onerror = function(e) {
      console.error("Error Adding an item: ", e);
    };








  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  }
};

app.router = (function() {
  var routes = {},
      decode = decodeURIComponent;

  function noop(s) { return s; }

  function sanitize(url) {
    ~url.indexOf('/?') && (url = url.replace('/?', '?'));
    url[0] == '/' && (url = url.slice(1));
    url[url.length - 1] == '/' && (url = url.slice(0, -1));

    return url;
  }

  function processUrl(url, esc) {
    var pieces = url.split('/'),
        rules = routes,
        params = {};

    for (var i = 0; i < pieces.length && rules; ++i) {
      var piece = esc(pieces[i]);
      rules = rules[ piece.toLowerCase() ] || rules[':'];
      rules && rules['~'] && (params[rules['~']] = piece);
    }

    return rules && {
      callback: rules['@'],
      params: params
    };
  }

  function processQuery(url, ctx, esc) {
    if (url && ctx.callback) {
      var hash = url.indexOf('#'),
          query = (hash < 0 ? url : url.slice(0, hash)).split('&');

      for (var i = 0; i < query.length; ++i) {
        var nameValue = query[i].split('=');

        ctx.params[nameValue[0]] = esc(nameValue[1]);
      }
    }

    return ctx;
  }

  function lookup(url) {
    var querySplit = sanitize(url).split('?'),
        esc = ~url.indexOf('%') ? decode : noop;

    return processQuery(querySplit[1], processUrl(querySplit[0], esc) || {}, esc);
  }

  return {
    add: function(route, handler) {

      var pieces = route.split('/'),
          rules = routes;

      for (var i = 0; i < pieces.length; ++i) {
        var piece = pieces[i],
            name = piece[0] == ':' ? ':' : piece.toLowerCase();

        rules = rules[name] || (rules[name] = {});

        name == ':' && ( rules['~'] = piece.slice(1) );
      }

      rules['@'] = handler;
    },

    exists: function (url) {
      return !!lookup(url).callback;
    },

    lookup: lookup,

    run: function(url) {
      var result = lookup(url);

      result.callback && result.callback({
        url: url,
        params: result.params
      });

      return !!result.callback;
    },
    routes: routes
  };
})();

app.snackbar = (function(){

  var Snackbar = function(element) {

    if ( !arguments.length ) {
      element = document.querySelector('#snackbar');
    }
    element = document.querySelector('#snackbar');

    this.element       = element;
    this.textElement   = this.element.querySelector('.' + this.cssClasses.MESSAGE);
    this.actionElement = this.element.querySelector('.' + this.cssClasses.ACTION);

    if (!this.textElement) {
      console.error('There must be a message element for a Snackbar.');
      return false;
    }
    
    if (!this.actionElement) {
      console.error('There must be an action element for a Snackbar.');
      return false;
    }

    this.active        = false;
    this.actionHandler = undefined;
    this.message       = undefined;
    this.actionText    = undefined;
    this.queuedNotifications = [];
    this.setActionHidden(true);
  };

  Snackbar.prototype.Constant = {
    ANIMATION_LENGTH: 500
  };

  Snackbar.prototype.cssClasses = {
    SNACKBAR: 'snackbar',
    MESSAGE:  'snackbar__text',
    ACTION:   'snackbar__action',
    ACTIVE:   'snackbar--active'
  };


  Snackbar.prototype.displaySnackbar = function() {
    this.element.setAttribute('aria-hidden', 'true');

    if (this.actionHandler) {
      this.actionElement.textContent = this.actionText;
      this.actionElement.addEventListener('click', this.actionHandler);
      this.setActionHidden(false);
    }

    this.textElement.textContent = this.message;
    this.element.classList.add(this.cssClasses.ACTIVE);
    this.element.setAttribute('aria-hidden', 'false');
    setTimeout(this.cleanup.bind(this), this.timeout);
  };

  Snackbar.prototype.showSnackbar = function(data) {
    if (data === undefined) {
      console.error('Please provide a data object with at least a message to display.');
      return false;
    }

    if (data.message === undefined) {
      console.error('Please provide a message to be displayed.');
      return false;
    }

    if (data.actionHandler && !data.actionText) {
      console.error('Please provide action text with the handler.');
      return false;
    }

    if (this.active) {
      this.queuedNotifications.push(data);
    } else {
      this.active = true;
      this.message = data.message;
      if (data.timeout) {
        this.timeout = data.timeout;
      } else {
        this.timeout = 2750;
      }
      if (data.actionHandler) {
        this.actionHandler = data.actionHandler;
      }
      if (data.actionText) {
        this.actionText = data.actionText;
      }
      this.displaySnackbar();
    }
  };

  Snackbar.prototype.checkQueue = function() {
    if ( this.queuedNotifications.length > 0) {
      this.showSnackbar(this.queuedNotifications.shift());
    }
  };


  Snackbar.prototype.cleanup = function() {
    this.element.classList.remove(this.cssClasses.ACTIVE);
    setTimeout(function() {
      this.element.setAttribute('aria-hidden', 'true');
      this.textElement.textContent = '';
      if (!this.actionElement.getAttribute('aria-hidden')) {
        this.setActionHidden(true);
        this.actionElement.textContent = '';
        this.actionElement.removeEventListener('click', this.actionHandler);
      }
      this.actionHandler = undefined;
      this.message = undefined;
      this.actionText = undefined;
      this.active = false;
      this.checkQueue();
    }.bind(this), (this.Constant.ANIMATION_LENGTH));
  };

  Snackbar.prototype.setActionHidden = function(value) {
    if (value) {
      this.actionElement.setAttribute('aria-hidden', 'true');
    } else {
      this.actionElement.removeAttribute('aria-hidden');
    }
  };

  return new Snackbar();
})();

app.initialize();