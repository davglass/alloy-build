AUI().add(
	'sortable',
	function(A) {
		var Lang = A.Lang,

			getClassName = A.ClassNameManager.getClassName,

			NAME = 'sortable',

			DDM = A.DD.DDM,

			CSS_DRAGGING = getClassName(NAME, 'dragging'),
			CSS_HANDLE = getClassName(NAME, 'handle'),
			CSS_ITEM = getClassName(NAME, 'item'),
			CSS_NO_HANDLES = getClassName(NAME, 'no-handles'),
			CSS_PLACEHOLDER = getClassName(NAME, 'placeholder'),
			CSS_PROXY = getClassName(NAME, 'proxy'),
			CSS_SORTABLE = getClassName(NAME);

		var Sortable = function() {
			Sortable.superclass.constructor.apply(this, arguments);
		};

		Sortable.NAME = NAME;

		Sortable.ATTRS = {
			dd: {
				value: {}
			},

			constrain: {},

			container: {
				value: null
			},

			groups: {
				valueFn: function() {
					var instance = this;

					return [A.guid()];
				}
			},

			nodes: {
				value: null,
				setter: function(value) {
					var instance = this;

					var container = instance.get('container');

					if (!(value instanceof A.NodeList)) {
						if(Lang.isString(value)) {
							if (container) {
								value = container.queryAll(value);
							}
							else {
								value = A.all(value);
							}
						}
					}

					if (value instanceof A.NodeList && value.size()) {
						instance.set('container', value.item(0).get('parentNode'));
					}
					else {
						value = A.Attribute.INVALID_VALUE;
					}

					return value;
				}
			},

			placeholder: {},

			proxy: {}
		};

		A.extend(
			Sortable,
			A.Base,
			{
				initializer: function() {
					var instance = this;

					var nodes = instance.get('nodes');

					var constrain = instance.get('constrain');

					instance._useConstrain = !!constrain;

					if (Lang.isObject(constrain)) {
						instance._constrainConfig = constrain;
					}

					var proxy = instance.get('proxy');

					instance._useProxy = !!proxy;

					if (Lang.isObject(proxy)) {
						instance._proxyConfig = proxy;
					}

					var ddConfig = instance.get('dd');

					instance._ddConfig = ddConfig;

					instance._ddConfig = A.mix(
						instance._ddConfig,
						{
							bubbles: instance,
							groups: instance.get('groups'),
							placeholder: instance.get('placeholder'),
							constrain: instance.get('constrain'),
							proxy: instance.get('proxy')
						}
					);

					if (nodes) {
						nodes.each(instance.add, instance);
					}

					instance.after('drag:drag', instance._onDrag);
					instance.after('drag:end', instance._onDragEnd);
					instance.after('drag:over', instance._onDragOver);
					instance.after('drag:start', instance._onDragStart);
				},

				add: function(item) {
					var instance = this;

					if (item) {
						var ddConfig = instance._ddConfig;

						if ((item instanceof A.Node) || Lang.isString(item) || item.nodeName) {
							item = A.get(item);

							ddConfig.node = item;
						}
						else if (Lang.isObject(item)) {
							A.mix(item, ddConfig);

							ddConfig = item;
						}

						var sortableItem = instance.getSortableItem();

						var dd = new sortableItem(ddConfig);
					}
				},

				getSortableItem: function() {
					var instance = this;

					return SortableItem;
				},

				_onDrag: function(event) {
					var instance = this;

					var drag = event.target;

					var lastXY = drag.lastXY;
					var x = lastXY[0];
					var y = lastXY[1];

					var lastX = instance._lastX;
					var lastY = instance._lastY;

					var xToleranceMet = Math.abs(x - lastX);
					var yToleranceMet = Math.abs(y - lastY);

					instance._goingUp = ((x < lastX) && xToleranceMet) || ((y < lastY) && yToleranceMet);

					instance._lastX = x;
					instance._lastY = y;

					A.later(50, DDM, DDM.syncActiveShims);
				},

				_onDragEnd: function(event) {
					var instance = this;

					var drag = event.target;
					var node = drag.get('node');

					node.removeClass(CSS_DRAGGING);
				},

				_onDragOver: function(event) {
					var instance = this;

					var sortDirection = 0;
					var midpoint = 0;
					var lastX = instance._lastX;
					var lastY = instance._lastY;

					var DDM = A.DD.DDM;
					var drag = event.drag;
					var drop = event.drop;

					var dropNode = drop.get('node');

					var action = 'placeBefore';

					if (!instance._goingUp) {
						action = 'placeAfter';
					}

					dropNode[action](drag.get('placeholder'));

					drop.sizeShim();
				},

				_onDragStart: function(event) {
					var instance = this;

					var drag = event.target;

					var node = drag.get('node');

					if (instance._useProxy) {
						drag.get('dragNode').addClass(CSS_PROXY);
					}

					node.addClass(CSS_DRAGGING);
				},

				_lastX: 0,
				_lastY: 0
			}
		);

		var SortableItem = function(config) {
			SortableItem.superclass.constructor.call(this, config.dd || config);
		};

		SortableItem.NAME = 'sortableitem';

		SortableItem.ATTRS = {
			constrain: {
				value: null
			},

			placeholder: {
				getter: function() {
					var instance = this;

					return instance.get('node');
				}
			},

			proxy: {
				value: {
					borderStyle: 0,
					moveOnEnd: false
				}
			},

			target: {
				value: true
			},

			syncPlaceholderSize: {
				value: true
			}
		};

		A.extend(
			SortableItem,
			A.DD.Drag,
			{
				initializer: function() {
					var instance = this;

					var node = instance.get('node');

					node.dd = instance;

					node.addClass(CSS_ITEM);

					instance._initHandles();
					instance._initConstrain();
					instance._initProxy();
				},

				_initHandles: function() {
					var instance = this;

					var handles = instance.get('handles');
					var node = instance.get('node');

					if (handles) {
						for (var i = handles.length - 1; i >= 0; i--) {
							var handle = handles[i];

							node.queryAll(handle).addClass(CSS_HANDLE);
						}
					}
					else {
						node.addClass(CSS_NO_HANDLES);
					}

					instance.removeInvalid('a');
				},

				_initConstrain: function() {
					var instance = this;

					var constrain = instance.get('constrain');

					if (!!constrain) {
						if (!Lang.isObject(constrain)) {
							constrain = null;
						}

						instance.plug(A.Plugin.DDConstrained, constrain);
					}
				},

				_initProxy: function() {
					var instance = this;

					var proxy = instance.get('proxy');

					if (!!proxy) {
						if (!Lang.isObject(proxy)) {
							proxy = null;
						}

						instance.plug(A.Plugin.DDProxy, proxy);

						instance.get('dragNode').addClass(CSS_PROXY);
					}
				}
			}
		);

		A.Sortable = Sortable;
		A.SortableItem = SortableItem;
	},
	'@VERSION',
	{
		requires: ['base', 'dd'],
		use: []
	}
);