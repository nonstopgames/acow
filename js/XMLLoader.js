/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * XMLLoader.js
 *
 * Small XML loader utility.
 * Allows you to load an XML and then run
 * a processing function on it. Also contains
 * a default processing function, which will
 * turn the XML document into an object hierarchy
 * (a hierarchy of XMLNode objects).
 *
 * creation date: 15-06-2012
 * 
 */

"use strict";

(function(ns) {
	
	if(ns.XMLLoader != undefined) {
		throw new Error("XMLLoader - cannot instantiate in " + ns + "; name conflict");
	}

	/**
	 * XMLNode - a hacky container object for XML data, enabling
	 * more straight-forward inspection of XML document hierarchies.
	 *
	 * @param n an XML DOM object, returned by XMLHttpRequest
	 */
	var XMLNode = function(n) {
		this._tagName = n.tagName;
		this._tagType = n.prefix;
		this._tagValue = n.text || n.textContent;
		this._children = [];
		this._attributes = {};
	};

	/**
	 * Convenience function for getting the value of the tag represented by this XMLNode
	 */
	XMLNode.prototype.getValue = function() {
		return this._tagValue;
	};

	/**
	 * Convenience function for getting the name of the tag represented by this XMLNode
	 */
	XMLNode.prototype.getTagName = function() {
		return this._tagName;
	};

	/**
	 * Convenience function for getting the type (xmlns) of the tag represented by this XMLNode
	 */
	XMLNode.prototype.getTagType = function() {
		return this._tagType;
	};

	/**
	 * Convenience function for accessing the child nodes of this XMLNode
	 */
	XMLNode.prototype.getChild = function(n) {
		if(this._children.length <= n) {
			throw new Error("No child at index " + n);
		}
		return this._children[n];
	};
	
	/**
	 * Convenience function for getting the number of child nodes this XMLNode has
	 */
	XMLNode.prototype.getNumChildren = function() {
		return this._children.length;
	};

	/**
	 * Convenience function for getting the value of a tag attribute of this XMLNode.
	 * Alternatively, access the property @attrname, for example node["@visible"];
	 */
	XMLNode.prototype.getAttribute = function(attr) {
		return this._attributes[attr];
	};

	function loader() {
		
		/**
		 * Get an XMLHttpRequest object.
		 * Errors out if the functionality, for some reason,
		 * is not supported.
		 *
		 * @returns an XMLHttpRequest object
		 */
		var __request_id = 1;
		var errorString = '';
		
		this.getRequest = function() {
			if(window.XMLHttpRequest) {
				var req = new XMLHttpRequest();
				req.request_id = __request_id++;
				return req;
			}
			throw new Error("XMLHttpRequest not supported?!");
		};
		
		/**
		 * Download an XML document, asynchronously.
		 *
		 * @param path URL or relative path to XML document
		 * @param callback a callback function, taking one parameter (the loaded request data)
		 * @param callback_this object to pass as 'this' pointer to the callback function
		 * @returns the XMLHttpRequest object managing the download
		 *
		 */
		this.load = function(path,callback,callback_this) {
			
			var req = this.getRequest();
			req.onreadystatechange = function(state) {
				if(this.readyState == 4) {
					if(callback instanceof Function) {
						callback.call(callback_this,this.responseXML);
					}
				}
			};
			req.open("GET",path,true);
			req.send(null);
			return req;
			
		};
		
		/**
		 * Parse an XML document and return an object hierarchy representing
		 * the document. All sub-nodes are available through an array;
		 * nodes with unique names are also available as properties.
		 * Nodes with non-unique names are available as arrays.
		 * 
		 * Not for the faint of heart.
		 */
		this.toObject = function(xmldoc) {

			var parseNode = function(n) {
				
				if(!n.tagName) return null;
				
				// Store basic stuff
				var obj = new XMLNode(n);
				
				// Store attributes
				if(n.attributes) {
					for(var i = 0; i < n.attributes.length; ++i) {
						obj._attributes[n.attributes[i].name] = n.attributes[i].nodeValue;
						obj["@" + n.attributes[i].name] = n.attributes[i].nodeValue;
					}
				}
				
				// Go through child nodes
				var l = n.childNodes.length;
				for(var i = 0; i < l; ++i) {
					var c = parseNode(n.childNodes[i]);
					if(c) {
						obj._children.push(c);
					}
				}
				
				// Link children as a fields
				for(var i = 0; i < obj._children.length; ++i) {
					var tname = obj._children[i]._tagName;
					if(obj.hasOwnProperty(tname)) {
						if(!(obj[tname] instanceof Array)) {
							var a = [obj[tname]];
							obj[tname] = a;
						}
						obj[tname].push(obj._children[i]);
					} else {
						obj[tname] = obj._children[i];
					}
				}
				
				return obj;
				
			};
			
			return parseNode(xmldoc.documentElement);
			
		};

		/**
		 * Retrieve a node (sub-object) from an object hierarhcy
		 *
		 * WARNING: Brittle
		 *
		 * @param an object returned by the toObject function
		 * @param query a query string (e.g. 'cannons.basic')
		 * @returns an object, like the one passed in, further down the hierarchy, or null if the requested node does not exist
		 */
		this.getNode = function(object, query) {
			
			var path = query.split('.');
			var obj = object;
			
			for(var i = 0; i < path.length; ++i) {
				
				// Trim node name (if needed...)
				var n = ("".trim !== undefined) ? (path[i].trim()) : (path[i].replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '));
				
				// Skip over arguments
				if(n.charAt(0) == '@') {
					continue;
				}
				
				var aidx = n.indexOf('[');
				if(aidx >= 0) {
					
					// Array indexing..
					var idx = parseInt(n.substring(aidx + 1, n.indexOf(']')));
					
					if(aidx === 0) {  // Get child node by index
						obj = obj._children[idx];
						if(obj === undefined) {
							throw i;
						}
					} else { // Get named node by index
						var oname = (n.substring(0,aidx));
						obj = obj[oname];
						if(obj === undefined) {
							throw i;
						} else {
							obj = obj[idx];
							if(obj === undefined) {
								throw i;
							}
						}
					}
					
				} else {
					// Standard node access
					obj = obj[n];
					if(obj === undefined) throw i;
				}
			}
			return obj;
			
		};
		
		/**
		 * Retrieve a value from a generated object tree by way of query string.
		 *
		 * WARNING: Brittle
		 *
		 * @param an object returned by the toObject function
		 * @param query a query string (e.g. 'global.numBadGuys' or 'global.enemies[4].@typename')
		 * @returns the requested value, if any
		 * @throw on error, an integer, representing the depth at which the query failed
		 */
		this.getValue = function(object, query) {
			var node = this.getNode(object,query);

			if(query.indexOf('@') != -1) {
				var path = query.split('.');
				var arg = path[path.length - 1];
				return node[arg];
			} else {
				return node.getValue();
			}

			return node ? node.getNumChildren() : null;
		};
		
		/**
		 * Retrieve the number of children from a generated object tree
		 *
		 * WARNING: Brittle
		 *
		 * @param an object returned by the toObject function
		 * @param query a query string (e.g. 'enemies')
		 * @returns the number of child nodes, or -1 if queried node does not exist
		 */
		this.getNumChildren = function(object, query) {
			var node = this.getNode(object,query);
			return node ? node.getNumChildren() : null;
		};

		/**
		 * Retrieve an array of child node names.
		 */
		this.getChildNames = function(object, query) {
			var node = this.getNode(object,query);
			var arr = [];
			for(var i = 0; i < node.getNumChildren(); ++i) {
				arr.push(node.getChild(i).getTagName());
			}
			return arr;
		};
		
		/**
		 * Get a verbose error string. Useful when exceptions are thrown around.
		 *
		 * @returns a String indicating the current error condition
		 */
		this.getError = function() {
			// TODO: this functionality is still missing - needs to be implemented in getNode and getValue
			return errorString;
		};
		
	};
	
	ns.XMLLoader = new loader();
	
})(window);
