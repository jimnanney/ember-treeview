(function(){


  function randomInt(min, max) {
    return Math.floor(Math.random()*(max-min) + min);
  }

  var treeNodes = Ember.A();
  var id=0;
  var max_depth=5;
  var max_children=10;

  function create_node(parentNodeId, depth, numChildren) {
    var hasChildren = depth < max_depth && numChildren > 0;
    var curDepth = depth < max_depth ? depth : max_depth;
    var nextId = id++;
    var expanded = depth < 2;
    var treeNode = Ember.Object.create({
      id: nextId,
      parentNode: parentNodeId,
      hasChildren: hasChildren,
      depth: depth,
      expanded: true,
      visible: true,
      depthName: "depth-"+depth
    });
    var nextDepth = depth + 1;
    treeNodes.push(treeNode);
    if(hasChildren) {
      while(numChildren--) {
        create_node(treeNode.id, nextDepth, randomInt(0,max_children));
      }
    }
  }

  create_node(null, 0, 10);

  window.app = Ember.Application.create({
    LOG_TRANSITIONS: true
  });

  app.Router.map(function() {
    this.route('details', {path: '/details/:details_id'}, function() {});
  });

  app.ApplicationRoute = Em.Route.extend({
    model: function() {
      return treeNodes;
    }
  });

  app.DetailsRoute = Em.Route.extend({
    model: function(params) {
      Ember.debug("In Details Route model hook");
      Ember.debug(params.details_id);
      console.log(params);
      var pid = parseInt(params.details_id);
      var results = treeNodes.filterBy('parentNode', pid);
      Ember.debug(results);
      return results;
    }
  });

  app.ApplicationController = Em.ArrayController.extend({
    hidden: [],
    tree: function() {
      var results = {};
      var sorted = this.get('model').sortBy('parentNode');
      sorted.forEach(function(item) {
        results[item.id] = { obj: item, parentNode: item.parentNode, children: [], parents: [] };
        if(item.parentNode && results[item.parentNode]) {
          var parents = results[item.parentNode].parents.map(function(node) { return node; });
          parents.push(results[item.parentNode]);
          item.parents = parents;
          results[item.parentNode].children.push(item);
        }
      });
      return results;
    }.property('model.[]', 'model'),
    shownCount: Em.computed.alias('model.[].length'),
    hiddenCount: Em.computed.alias('hidden.[].length'),
    getChildrenBounds: function(arr, branch) {
      var id = branch.get('id');
      var depth = branch.get('depth');
      var startIndex = -1;
      var endIndex = arr.length;
      arr.find(function(item, idx) {
        if ( id === item.get('id') ) {
          startIndex = idx + 1;
          return false;
        }
        if ( (startIndex > -1) && (item.get('depth') === depth)) {
          endIndex = idx;
          return true;
        }
      });
      childCount = (startIndex > -1) ? endIndex - startIndex : 0;
      return { startIndex: startIndex, endIndex: endIndex, childCount: childCount};
    },
    actions: {
      toggle: function(item) {
        if (item.get('expanded')) {
          this.send('collapseBranch', item);
        } else {
          this.send('expandBranch',item);
        }
      },

      collapseBranch: function(branch) {
        var model = this.get('model');
        var hidden = this.get('hidden');
        var slice = this.getChildrenBounds(model, branch);
        if (slice.childCount < 1) { return; }
        hidden.addObjects(model.slice(slice.startIndex, slice.endIndex));
        model.removeAt(slice.startIndex, slice.childCount);
        hidden.setEach('expanded', false);
        branch.set('expanded', false);
        return;
      },

      expandBranch: function(branch) {
        var toShow = [];
        var hidden = this.get('hidden');
        var model = this.get('model');
        var insertPosition = 0;
        var shownItemsInsertPosition = 0;
        // This is too slow if expanding adds more than ~ 500 items 
        // The recursion kills it.
        var show = function(item) {
          hidden.removeObject(item);
          toShow.insertAt(insertPosition++, item);
          if (item.hasChildren && item.expanded) {
            hidden.filterBy('parentNode', item.get('id'))
            .forEach(function(insertItem) { show(insertItem); });
          }
        };
        hidden.filterBy('parentNode', branch.get('id')).forEach(function(insertItem) {
          show(insertItem);
        });
        shownItemsInsertPosition = model.indexOf(model.findBy('id', branch.get('id')))+1;
        model.replace(shownItemsInsertPosition, 0, toShow);
        branch.set('expanded', true);
      },
    }
  });

  app.NodeView = Em.ReusableListItemView.extend({
    templateName: 'node'
  });



  // use an arrayproxy to decorate nodes with a depth property
  // --------
  // Store the parent ids in an array for each node
  // depth = the number of parents stored
  // leftmost is the root
  // rightmost is the parent
  // sort the objects based on the parent id
  // traverse the objects by parent id
  // when attaching the child to a parent, copy it's parent's parent path and add the child'd parent id to the path
  // selecting all children becomes filter function(item) return { item.parents.indexOf(id) > -1; }
})();
