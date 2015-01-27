# ember-treeview
A tree-view component based off of ember list view

Infancy stages, more a proof of concept at this point.

Expansion is slow if you comment line 116 treeview.js which sets all child nodes of the node collapsing to be not expanded.

Over 50,000 nodes and the loops take too long for collapse.

At 5,000 nodes and below the collapse is ok.

Saved expand/collapse state over 500 nodes seems to be too slow as well.

