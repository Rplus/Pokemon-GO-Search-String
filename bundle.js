
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            if (detaching)
                component.$$.fragment.d(1);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var pms = [
    	{
    		dex: 1,
    		ads: [
    			118,
    			111,
    			128
    		]
    	},
    	{
    		dex: 2,
    		ads: [
    			151,
    			143,
    			155
    		]
    	},
    	{
    		dex: 3,
    		ads: [
    			198,
    			189,
    			190
    		]
    	},
    	{
    		dex: 4,
    		ads: [
    			116,
    			93,
    			118
    		]
    	},
    	{
    		dex: 5,
    		ads: [
    			158,
    			126,
    			151
    		]
    	},
    	{
    		dex: 6,
    		ads: [
    			223,
    			173,
    			186
    		]
    	},
    	{
    		dex: 7,
    		ads: [
    			94,
    			121,
    			127
    		]
    	},
    	{
    		dex: 8,
    		ads: [
    			126,
    			155,
    			153
    		]
    	},
    	{
    		dex: 9,
    		ads: [
    			171,
    			207,
    			188
    		]
    	},
    	{
    		dex: 10,
    		ads: [
    			55,
    			55,
    			128
    		]
    	},
    	{
    		dex: 11,
    		ads: [
    			45,
    			80,
    			137
    		]
    	},
    	{
    		dex: 12,
    		ads: [
    			167,
    			137,
    			155
    		]
    	},
    	{
    		dex: 13,
    		ads: [
    			63,
    			50,
    			120
    		]
    	},
    	{
    		dex: 14,
    		ads: [
    			46,
    			75,
    			128
    		]
    	},
    	{
    		dex: 15,
    		ads: [
    			169,
    			130,
    			163
    		]
    	},
    	{
    		dex: 16,
    		ads: [
    			85,
    			73,
    			120
    		]
    	},
    	{
    		dex: 17,
    		ads: [
    			117,
    			105,
    			160
    		]
    	},
    	{
    		dex: 18,
    		ads: [
    			166,
    			154,
    			195
    		]
    	},
    	{
    		dex: 19,
    		ads: [
    			103,
    			70,
    			102
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 19,
    		ads: [
    			103,
    			70,
    			102
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 20,
    		ads: [
    			135,
    			154,
    			181
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 20,
    		ads: [
    			161,
    			139,
    			146
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 21,
    		ads: [
    			112,
    			60,
    			120
    		]
    	},
    	{
    		dex: 22,
    		ads: [
    			182,
    			133,
    			163
    		]
    	},
    	{
    		dex: 23,
    		ads: [
    			110,
    			97,
    			111
    		]
    	},
    	{
    		dex: 24,
    		ads: [
    			167,
    			153,
    			155
    		]
    	},
    	{
    		dex: 25,
    		ads: [
    			112,
    			96,
    			111
    		]
    	},
    	{
    		dex: 26,
    		ads: [
    			201,
    			154,
    			155
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 26,
    		ads: [
    			193,
    			151,
    			155
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 27,
    		ads: [
    			125,
    			129,
    			137
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 27,
    		ads: [
    			126,
    			120,
    			137
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 28,
    		ads: [
    			177,
    			195,
    			181
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 28,
    		ads: [
    			182,
    			175,
    			181
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 29,
    		ads: [
    			86,
    			89,
    			146
    		]
    	},
    	{
    		dex: 30,
    		ads: [
    			117,
    			120,
    			172
    		]
    	},
    	{
    		dex: 31,
    		ads: [
    			180,
    			173,
    			207
    		]
    	},
    	{
    		dex: 32,
    		ads: [
    			105,
    			76,
    			130
    		]
    	},
    	{
    		dex: 33,
    		ads: [
    			137,
    			111,
    			156
    		]
    	},
    	{
    		dex: 34,
    		ads: [
    			204,
    			156,
    			191
    		]
    	},
    	{
    		dex: 35,
    		ads: [
    			107,
    			108,
    			172
    		]
    	},
    	{
    		dex: 36,
    		ads: [
    			178,
    			162,
    			216
    		]
    	},
    	{
    		dex: 37,
    		ads: [
    			96,
    			109,
    			116
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 37,
    		ads: [
    			96,
    			109,
    			116
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 38,
    		ads: [
    			170,
    			193,
    			177
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 38,
    		ads: [
    			169,
    			190,
    			177
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 39,
    		ads: [
    			80,
    			41,
    			251
    		]
    	},
    	{
    		dex: 40,
    		ads: [
    			156,
    			90,
    			295
    		]
    	},
    	{
    		dex: 41,
    		ads: [
    			83,
    			73,
    			120
    		]
    	},
    	{
    		dex: 42,
    		ads: [
    			161,
    			150,
    			181
    		]
    	},
    	{
    		dex: 43,
    		ads: [
    			131,
    			112,
    			128
    		]
    	},
    	{
    		dex: 44,
    		ads: [
    			153,
    			136,
    			155
    		]
    	},
    	{
    		dex: 45,
    		ads: [
    			202,
    			167,
    			181
    		]
    	},
    	{
    		dex: 46,
    		ads: [
    			121,
    			99,
    			111
    		]
    	},
    	{
    		dex: 47,
    		ads: [
    			165,
    			146,
    			155
    		]
    	},
    	{
    		dex: 48,
    		ads: [
    			100,
    			100,
    			155
    		]
    	},
    	{
    		dex: 49,
    		ads: [
    			179,
    			143,
    			172
    		]
    	},
    	{
    		dex: 50,
    		ads: [
    			108,
    			81,
    			67
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 50,
    		ads: [
    			109,
    			78,
    			67
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 51,
    		ads: [
    			201,
    			142,
    			111
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 51,
    		ads: [
    			167,
    			136,
    			111
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 52,
    		ads: [
    			99,
    			78,
    			120
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 52,
    		ads: [
    			92,
    			78,
    			120
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 53,
    		ads: [
    			158,
    			136,
    			163
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 53,
    		ads: [
    			150,
    			136,
    			163
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 54,
    		ads: [
    			122,
    			95,
    			137
    		]
    	},
    	{
    		dex: 55,
    		ads: [
    			191,
    			162,
    			190
    		]
    	},
    	{
    		dex: 56,
    		ads: [
    			148,
    			82,
    			120
    		]
    	},
    	{
    		dex: 57,
    		ads: [
    			207,
    			138,
    			163
    		]
    	},
    	{
    		dex: 58,
    		ads: [
    			136,
    			93,
    			146
    		]
    	},
    	{
    		dex: 59,
    		ads: [
    			227,
    			166,
    			207
    		]
    	},
    	{
    		dex: 60,
    		ads: [
    			101,
    			82,
    			120
    		]
    	},
    	{
    		dex: 61,
    		ads: [
    			130,
    			123,
    			163
    		]
    	},
    	{
    		dex: 62,
    		ads: [
    			182,
    			184,
    			207
    		]
    	},
    	{
    		dex: 63,
    		ads: [
    			195,
    			82,
    			93
    		]
    	},
    	{
    		dex: 64,
    		ads: [
    			232,
    			117,
    			120
    		]
    	},
    	{
    		dex: 65,
    		ads: [
    			271,
    			167,
    			146
    		]
    	},
    	{
    		dex: 66,
    		ads: [
    			137,
    			82,
    			172
    		]
    	},
    	{
    		dex: 67,
    		ads: [
    			177,
    			125,
    			190
    		]
    	},
    	{
    		dex: 68,
    		ads: [
    			234,
    			159,
    			207
    		]
    	},
    	{
    		dex: 69,
    		ads: [
    			139,
    			61,
    			137
    		]
    	},
    	{
    		dex: 70,
    		ads: [
    			172,
    			92,
    			163
    		]
    	},
    	{
    		dex: 71,
    		ads: [
    			207,
    			135,
    			190
    		]
    	},
    	{
    		dex: 72,
    		ads: [
    			97,
    			149,
    			120
    		]
    	},
    	{
    		dex: 73,
    		ads: [
    			166,
    			209,
    			190
    		]
    	},
    	{
    		dex: 74,
    		ads: [
    			132,
    			132,
    			120
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 74,
    		ads: [
    			132,
    			132,
    			120
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 75,
    		ads: [
    			164,
    			164,
    			146
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 75,
    		ads: [
    			164,
    			164,
    			146
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 76,
    		ads: [
    			211,
    			198,
    			190
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 76,
    		ads: [
    			211,
    			198,
    			190
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 77,
    		ads: [
    			170,
    			127,
    			137
    		]
    	},
    	{
    		dex: 78,
    		ads: [
    			207,
    			162,
    			163
    		]
    	},
    	{
    		dex: 79,
    		ads: [
    			109,
    			98,
    			207
    		]
    	},
    	{
    		dex: 80,
    		ads: [
    			177,
    			180,
    			216
    		]
    	},
    	{
    		dex: 81,
    		ads: [
    			165,
    			121,
    			93
    		]
    	},
    	{
    		dex: 82,
    		ads: [
    			223,
    			169,
    			137
    		]
    	},
    	{
    		dex: 83,
    		ads: [
    			124,
    			115,
    			141
    		]
    	},
    	{
    		dex: 84,
    		ads: [
    			158,
    			83,
    			111
    		]
    	},
    	{
    		dex: 85,
    		ads: [
    			218,
    			140,
    			155
    		]
    	},
    	{
    		dex: 86,
    		ads: [
    			85,
    			121,
    			163
    		]
    	},
    	{
    		dex: 87,
    		ads: [
    			139,
    			177,
    			207
    		]
    	},
    	{
    		dex: 88,
    		ads: [
    			135,
    			90,
    			190
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 88,
    		ads: [
    			135,
    			90,
    			190
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 89,
    		ads: [
    			190,
    			172,
    			233
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 89,
    		ads: [
    			190,
    			172,
    			233
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 90,
    		ads: [
    			116,
    			134,
    			102
    		]
    	},
    	{
    		dex: 91,
    		ads: [
    			186,
    			256,
    			137
    		]
    	},
    	{
    		dex: 92,
    		ads: [
    			186,
    			67,
    			102
    		]
    	},
    	{
    		dex: 93,
    		ads: [
    			223,
    			107,
    			128
    		]
    	},
    	{
    		dex: 94,
    		ads: [
    			261,
    			149,
    			155
    		]
    	},
    	{
    		dex: 95,
    		ads: [
    			85,
    			232,
    			111
    		]
    	},
    	{
    		dex: 96,
    		ads: [
    			89,
    			136,
    			155
    		]
    	},
    	{
    		dex: 97,
    		ads: [
    			144,
    			193,
    			198
    		]
    	},
    	{
    		dex: 98,
    		ads: [
    			181,
    			124,
    			102
    		]
    	},
    	{
    		dex: 99,
    		ads: [
    			240,
    			181,
    			146
    		]
    	},
    	{
    		dex: 100,
    		ads: [
    			109,
    			111,
    			120
    		]
    	},
    	{
    		dex: 101,
    		ads: [
    			173,
    			173,
    			155
    		]
    	},
    	{
    		dex: 102,
    		ads: [
    			107,
    			125,
    			155
    		]
    	},
    	{
    		dex: 103,
    		ads: [
    			230,
    			153,
    			216
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 103,
    		ads: [
    			233,
    			149,
    			216
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 104,
    		ads: [
    			90,
    			144,
    			137
    		]
    	},
    	{
    		dex: 105,
    		ads: [
    			144,
    			186,
    			155
    		],
    		isotope: "alola"
    	},
    	{
    		dex: 105,
    		ads: [
    			144,
    			186,
    			155
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 106,
    		ads: [
    			224,
    			181,
    			137
    		]
    	},
    	{
    		dex: 107,
    		ads: [
    			193,
    			197,
    			137
    		]
    	},
    	{
    		dex: 108,
    		ads: [
    			108,
    			137,
    			207
    		]
    	},
    	{
    		dex: 109,
    		ads: [
    			119,
    			141,
    			120
    		]
    	},
    	{
    		dex: 110,
    		ads: [
    			174,
    			197,
    			163
    		]
    	},
    	{
    		dex: 111,
    		ads: [
    			140,
    			127,
    			190
    		]
    	},
    	{
    		dex: 112,
    		ads: [
    			222,
    			171,
    			233
    		]
    	},
    	{
    		dex: 113,
    		ads: [
    			60,
    			128,
    			487
    		]
    	},
    	{
    		dex: 114,
    		ads: [
    			183,
    			169,
    			163
    		]
    	},
    	{
    		dex: 115,
    		ads: [
    			181,
    			165,
    			233
    		]
    	},
    	{
    		dex: 116,
    		ads: [
    			129,
    			103,
    			102
    		]
    	},
    	{
    		dex: 117,
    		ads: [
    			187,
    			156,
    			146
    		]
    	},
    	{
    		dex: 118,
    		ads: [
    			123,
    			110,
    			128
    		]
    	},
    	{
    		dex: 119,
    		ads: [
    			175,
    			147,
    			190
    		]
    	},
    	{
    		dex: 120,
    		ads: [
    			137,
    			112,
    			102
    		]
    	},
    	{
    		dex: 121,
    		ads: [
    			210,
    			184,
    			155
    		]
    	},
    	{
    		dex: 122,
    		ads: [
    			192,
    			205,
    			120
    		]
    	},
    	{
    		dex: 123,
    		ads: [
    			218,
    			170,
    			172
    		]
    	},
    	{
    		dex: 124,
    		ads: [
    			223,
    			151,
    			163
    		]
    	},
    	{
    		dex: 125,
    		ads: [
    			198,
    			158,
    			163
    		]
    	},
    	{
    		dex: 126,
    		ads: [
    			206,
    			154,
    			163
    		]
    	},
    	{
    		dex: 127,
    		ads: [
    			238,
    			182,
    			163
    		]
    	},
    	{
    		dex: 128,
    		ads: [
    			198,
    			183,
    			181
    		]
    	},
    	{
    		dex: 129,
    		ads: [
    			29,
    			85,
    			85
    		]
    	},
    	{
    		dex: 130,
    		ads: [
    			237,
    			186,
    			216
    		]
    	},
    	{
    		dex: 131,
    		ads: [
    			165,
    			174,
    			277
    		]
    	},
    	{
    		dex: 132,
    		ads: [
    			91,
    			91,
    			134
    		]
    	},
    	{
    		dex: 133,
    		ads: [
    			104,
    			114,
    			146
    		]
    	},
    	{
    		dex: 134,
    		ads: [
    			205,
    			161,
    			277
    		]
    	},
    	{
    		dex: 135,
    		ads: [
    			232,
    			182,
    			163
    		]
    	},
    	{
    		dex: 136,
    		ads: [
    			246,
    			179,
    			163
    		]
    	},
    	{
    		dex: 137,
    		ads: [
    			153,
    			136,
    			163
    		]
    	},
    	{
    		dex: 138,
    		ads: [
    			155,
    			153,
    			111
    		]
    	},
    	{
    		dex: 139,
    		ads: [
    			207,
    			201,
    			172
    		]
    	},
    	{
    		dex: 140,
    		ads: [
    			148,
    			140,
    			102
    		]
    	},
    	{
    		dex: 141,
    		ads: [
    			220,
    			186,
    			155
    		]
    	},
    	{
    		dex: 142,
    		ads: [
    			221,
    			159,
    			190
    		]
    	},
    	{
    		dex: 143,
    		ads: [
    			190,
    			169,
    			330
    		]
    	},
    	{
    		dex: 144,
    		ads: [
    			192,
    			236,
    			207
    		]
    	},
    	{
    		dex: 145,
    		ads: [
    			253,
    			185,
    			207
    		]
    	},
    	{
    		dex: 146,
    		ads: [
    			251,
    			181,
    			207
    		]
    	},
    	{
    		dex: 147,
    		ads: [
    			119,
    			91,
    			121
    		]
    	},
    	{
    		dex: 148,
    		ads: [
    			163,
    			135,
    			156
    		]
    	},
    	{
    		dex: 149,
    		ads: [
    			263,
    			198,
    			209
    		]
    	},
    	{
    		dex: 150,
    		ads: [
    			300,
    			182,
    			214
    		]
    	},
    	{
    		dex: 151,
    		ads: [
    			210,
    			210,
    			225
    		]
    	},
    	{
    		dex: 152,
    		ads: [
    			92,
    			122,
    			128
    		]
    	},
    	{
    		dex: 153,
    		ads: [
    			122,
    			155,
    			155
    		]
    	},
    	{
    		dex: 154,
    		ads: [
    			168,
    			202,
    			190
    		]
    	},
    	{
    		dex: 155,
    		ads: [
    			116,
    			93,
    			118
    		]
    	},
    	{
    		dex: 156,
    		ads: [
    			158,
    			126,
    			151
    		]
    	},
    	{
    		dex: 157,
    		ads: [
    			223,
    			173,
    			186
    		]
    	},
    	{
    		dex: 158,
    		ads: [
    			117,
    			109,
    			137
    		]
    	},
    	{
    		dex: 159,
    		ads: [
    			150,
    			142,
    			163
    		]
    	},
    	{
    		dex: 160,
    		ads: [
    			205,
    			188,
    			198
    		]
    	},
    	{
    		dex: 161,
    		ads: [
    			79,
    			73,
    			111
    		]
    	},
    	{
    		dex: 162,
    		ads: [
    			148,
    			125,
    			198
    		]
    	},
    	{
    		dex: 163,
    		ads: [
    			67,
    			88,
    			155
    		]
    	},
    	{
    		dex: 164,
    		ads: [
    			145,
    			156,
    			225
    		]
    	},
    	{
    		dex: 165,
    		ads: [
    			72,
    			118,
    			120
    		]
    	},
    	{
    		dex: 166,
    		ads: [
    			107,
    			179,
    			146
    		]
    	},
    	{
    		dex: 167,
    		ads: [
    			105,
    			73,
    			120
    		]
    	},
    	{
    		dex: 168,
    		ads: [
    			161,
    			124,
    			172
    		]
    	},
    	{
    		dex: 169,
    		ads: [
    			194,
    			178,
    			198
    		]
    	},
    	{
    		dex: 170,
    		ads: [
    			106,
    			97,
    			181
    		]
    	},
    	{
    		dex: 171,
    		ads: [
    			146,
    			137,
    			268
    		]
    	},
    	{
    		dex: 172,
    		ads: [
    			77,
    			53,
    			85
    		]
    	},
    	{
    		dex: 173,
    		ads: [
    			75,
    			79,
    			137
    		]
    	},
    	{
    		dex: 174,
    		ads: [
    			69,
    			32,
    			207
    		]
    	},
    	{
    		dex: 175,
    		ads: [
    			67,
    			116,
    			111
    		]
    	},
    	{
    		dex: 176,
    		ads: [
    			139,
    			181,
    			146
    		]
    	},
    	{
    		dex: 177,
    		ads: [
    			134,
    			89,
    			120
    		]
    	},
    	{
    		dex: 178,
    		ads: [
    			192,
    			146,
    			163
    		]
    	},
    	{
    		dex: 179,
    		ads: [
    			114,
    			79,
    			146
    		]
    	},
    	{
    		dex: 180,
    		ads: [
    			145,
    			109,
    			172
    		]
    	},
    	{
    		dex: 181,
    		ads: [
    			211,
    			169,
    			207
    		]
    	},
    	{
    		dex: 182,
    		ads: [
    			169,
    			186,
    			181
    		]
    	},
    	{
    		dex: 183,
    		ads: [
    			37,
    			93,
    			172
    		]
    	},
    	{
    		dex: 184,
    		ads: [
    			112,
    			152,
    			225
    		]
    	},
    	{
    		dex: 185,
    		ads: [
    			167,
    			176,
    			172
    		]
    	},
    	{
    		dex: 186,
    		ads: [
    			174,
    			179,
    			207
    		]
    	},
    	{
    		dex: 187,
    		ads: [
    			67,
    			94,
    			111
    		]
    	},
    	{
    		dex: 188,
    		ads: [
    			91,
    			120,
    			146
    		]
    	},
    	{
    		dex: 189,
    		ads: [
    			118,
    			183,
    			181
    		]
    	},
    	{
    		dex: 190,
    		ads: [
    			136,
    			112,
    			146
    		]
    	},
    	{
    		dex: 191,
    		ads: [
    			55,
    			55,
    			102
    		]
    	},
    	{
    		dex: 192,
    		ads: [
    			185,
    			135,
    			181
    		]
    	},
    	{
    		dex: 193,
    		ads: [
    			154,
    			94,
    			163
    		]
    	},
    	{
    		dex: 194,
    		ads: [
    			75,
    			66,
    			146
    		]
    	},
    	{
    		dex: 195,
    		ads: [
    			152,
    			143,
    			216
    		]
    	},
    	{
    		dex: 196,
    		ads: [
    			261,
    			175,
    			163
    		]
    	},
    	{
    		dex: 197,
    		ads: [
    			126,
    			240,
    			216
    		]
    	},
    	{
    		dex: 198,
    		ads: [
    			175,
    			87,
    			155
    		]
    	},
    	{
    		dex: 199,
    		ads: [
    			177,
    			180,
    			216
    		]
    	},
    	{
    		dex: 200,
    		ads: [
    			167,
    			154,
    			155
    		]
    	},
    	{
    		dex: 201,
    		ads: [
    			136,
    			91,
    			134
    		]
    	},
    	{
    		dex: 202,
    		ads: [
    			60,
    			106,
    			382
    		]
    	},
    	{
    		dex: 203,
    		ads: [
    			182,
    			133,
    			172
    		]
    	},
    	{
    		dex: 204,
    		ads: [
    			108,
    			122,
    			137
    		]
    	},
    	{
    		dex: 205,
    		ads: [
    			161,
    			205,
    			181
    		]
    	},
    	{
    		dex: 206,
    		ads: [
    			131,
    			128,
    			225
    		]
    	},
    	{
    		dex: 207,
    		ads: [
    			143,
    			184,
    			163
    		]
    	},
    	{
    		dex: 208,
    		ads: [
    			148,
    			272,
    			181
    		]
    	},
    	{
    		dex: 209,
    		ads: [
    			137,
    			85,
    			155
    		]
    	},
    	{
    		dex: 210,
    		ads: [
    			212,
    			131,
    			207
    		]
    	},
    	{
    		dex: 211,
    		ads: [
    			184,
    			138,
    			163
    		]
    	},
    	{
    		dex: 212,
    		ads: [
    			236,
    			181,
    			172
    		]
    	},
    	{
    		dex: 213,
    		ads: [
    			17,
    			396,
    			85
    		]
    	},
    	{
    		dex: 214,
    		ads: [
    			234,
    			179,
    			190
    		]
    	},
    	{
    		dex: 215,
    		ads: [
    			189,
    			146,
    			146
    		]
    	},
    	{
    		dex: 216,
    		ads: [
    			142,
    			93,
    			155
    		]
    	},
    	{
    		dex: 217,
    		ads: [
    			236,
    			144,
    			207
    		]
    	},
    	{
    		dex: 218,
    		ads: [
    			118,
    			71,
    			120
    		]
    	},
    	{
    		dex: 219,
    		ads: [
    			139,
    			191,
    			137
    		]
    	},
    	{
    		dex: 220,
    		ads: [
    			90,
    			69,
    			137
    		]
    	},
    	{
    		dex: 221,
    		ads: [
    			181,
    			138,
    			225
    		]
    	},
    	{
    		dex: 222,
    		ads: [
    			118,
    			156,
    			146
    		]
    	},
    	{
    		dex: 223,
    		ads: [
    			127,
    			69,
    			111
    		]
    	},
    	{
    		dex: 224,
    		ads: [
    			197,
    			141,
    			181
    		]
    	},
    	{
    		dex: 225,
    		ads: [
    			128,
    			90,
    			128
    		]
    	},
    	{
    		dex: 226,
    		ads: [
    			148,
    			226,
    			163
    		]
    	},
    	{
    		dex: 227,
    		ads: [
    			148,
    			226,
    			163
    		]
    	},
    	{
    		dex: 228,
    		ads: [
    			152,
    			83,
    			128
    		]
    	},
    	{
    		dex: 229,
    		ads: [
    			224,
    			144,
    			181
    		]
    	},
    	{
    		dex: 230,
    		ads: [
    			194,
    			194,
    			181
    		]
    	},
    	{
    		dex: 231,
    		ads: [
    			107,
    			98,
    			207
    		]
    	},
    	{
    		dex: 232,
    		ads: [
    			214,
    			185,
    			207
    		]
    	},
    	{
    		dex: 233,
    		ads: [
    			198,
    			180,
    			198
    		]
    	},
    	{
    		dex: 234,
    		ads: [
    			192,
    			131,
    			177
    		]
    	},
    	{
    		dex: 235,
    		ads: [
    			40,
    			83,
    			146
    		]
    	},
    	{
    		dex: 236,
    		ads: [
    			64,
    			64,
    			111
    		]
    	},
    	{
    		dex: 237,
    		ads: [
    			173,
    			207,
    			137
    		]
    	},
    	{
    		dex: 238,
    		ads: [
    			153,
    			91,
    			128
    		]
    	},
    	{
    		dex: 239,
    		ads: [
    			135,
    			101,
    			128
    		]
    	},
    	{
    		dex: 240,
    		ads: [
    			151,
    			99,
    			128
    		]
    	},
    	{
    		dex: 241,
    		ads: [
    			157,
    			193,
    			216
    		]
    	},
    	{
    		dex: 242,
    		ads: [
    			129,
    			169,
    			496
    		]
    	},
    	{
    		dex: 243,
    		ads: [
    			241,
    			195,
    			207
    		]
    	},
    	{
    		dex: 244,
    		ads: [
    			235,
    			171,
    			251
    		]
    	},
    	{
    		dex: 245,
    		ads: [
    			180,
    			235,
    			225
    		]
    	},
    	{
    		dex: 246,
    		ads: [
    			115,
    			93,
    			137
    		]
    	},
    	{
    		dex: 247,
    		ads: [
    			155,
    			133,
    			172
    		]
    	},
    	{
    		dex: 248,
    		ads: [
    			251,
    			207,
    			225
    		]
    	},
    	{
    		dex: 249,
    		ads: [
    			193,
    			310,
    			235
    		]
    	},
    	{
    		dex: 250,
    		ads: [
    			239,
    			244,
    			214
    		]
    	},
    	{
    		dex: 251,
    		ads: [
    			210,
    			210,
    			225
    		]
    	},
    	{
    		dex: 252,
    		ads: [
    			124,
    			94,
    			120
    		]
    	},
    	{
    		dex: 253,
    		ads: [
    			172,
    			120,
    			137
    		]
    	},
    	{
    		dex: 254,
    		ads: [
    			223,
    			169,
    			172
    		]
    	},
    	{
    		dex: 255,
    		ads: [
    			130,
    			87,
    			128
    		]
    	},
    	{
    		dex: 256,
    		ads: [
    			163,
    			115,
    			155
    		]
    	},
    	{
    		dex: 257,
    		ads: [
    			240,
    			141,
    			190
    		]
    	},
    	{
    		dex: 258,
    		ads: [
    			126,
    			93,
    			137
    		]
    	},
    	{
    		dex: 259,
    		ads: [
    			156,
    			133,
    			172
    		]
    	},
    	{
    		dex: 260,
    		ads: [
    			208,
    			175,
    			225
    		]
    	},
    	{
    		dex: 261,
    		ads: [
    			96,
    			61,
    			111
    		]
    	},
    	{
    		dex: 262,
    		ads: [
    			171,
    			132,
    			172
    		]
    	},
    	{
    		dex: 263,
    		ads: [
    			58,
    			80,
    			116
    		]
    	},
    	{
    		dex: 264,
    		ads: [
    			142,
    			128,
    			186
    		]
    	},
    	{
    		dex: 265,
    		ads: [
    			75,
    			59,
    			128
    		]
    	},
    	{
    		dex: 266,
    		ads: [
    			60,
    			77,
    			137
    		]
    	},
    	{
    		dex: 267,
    		ads: [
    			189,
    			98,
    			155
    		]
    	},
    	{
    		dex: 268,
    		ads: [
    			60,
    			77,
    			137
    		]
    	},
    	{
    		dex: 269,
    		ads: [
    			98,
    			162,
    			155
    		]
    	},
    	{
    		dex: 270,
    		ads: [
    			71,
    			77,
    			120
    		]
    	},
    	{
    		dex: 271,
    		ads: [
    			112,
    			119,
    			155
    		]
    	},
    	{
    		dex: 272,
    		ads: [
    			173,
    			176,
    			190
    		]
    	},
    	{
    		dex: 273,
    		ads: [
    			71,
    			77,
    			120
    		]
    	},
    	{
    		dex: 274,
    		ads: [
    			134,
    			78,
    			172
    		]
    	},
    	{
    		dex: 275,
    		ads: [
    			200,
    			121,
    			207
    		]
    	},
    	{
    		dex: 276,
    		ads: [
    			106,
    			61,
    			120
    		]
    	},
    	{
    		dex: 277,
    		ads: [
    			185,
    			124,
    			155
    		]
    	},
    	{
    		dex: 278,
    		ads: [
    			106,
    			61,
    			120
    		]
    	},
    	{
    		dex: 279,
    		ads: [
    			175,
    			174,
    			155
    		]
    	},
    	{
    		dex: 280,
    		ads: [
    			79,
    			59,
    			99
    		]
    	},
    	{
    		dex: 281,
    		ads: [
    			117,
    			90,
    			116
    		]
    	},
    	{
    		dex: 282,
    		ads: [
    			237,
    			195,
    			169
    		]
    	},
    	{
    		dex: 283,
    		ads: [
    			93,
    			87,
    			120
    		]
    	},
    	{
    		dex: 284,
    		ads: [
    			192,
    			150,
    			172
    		]
    	},
    	{
    		dex: 285,
    		ads: [
    			74,
    			110,
    			155
    		]
    	},
    	{
    		dex: 286,
    		ads: [
    			241,
    			144,
    			155
    		]
    	},
    	{
    		dex: 287,
    		ads: [
    			104,
    			92,
    			155
    		]
    	},
    	{
    		dex: 288,
    		ads: [
    			159,
    			145,
    			190
    		]
    	},
    	{
    		dex: 289,
    		ads: [
    			290,
    			166,
    			284
    		]
    	},
    	{
    		dex: 290,
    		ads: [
    			80,
    			126,
    			104
    		]
    	},
    	{
    		dex: 291,
    		ads: [
    			199,
    			112,
    			156
    		]
    	},
    	{
    		dex: 292,
    		ads: [
    			153,
    			73,
    			1
    		]
    	},
    	{
    		dex: 293,
    		ads: [
    			92,
    			42,
    			162
    		]
    	},
    	{
    		dex: 294,
    		ads: [
    			134,
    			81,
    			197
    		]
    	},
    	{
    		dex: 295,
    		ads: [
    			179,
    			137,
    			232
    		]
    	},
    	{
    		dex: 296,
    		ads: [
    			99,
    			54,
    			176
    		]
    	},
    	{
    		dex: 297,
    		ads: [
    			209,
    			114,
    			302
    		]
    	},
    	{
    		dex: 298,
    		ads: [
    			36,
    			71,
    			137
    		]
    	},
    	{
    		dex: 299,
    		ads: [
    			82,
    			215,
    			102
    		]
    	},
    	{
    		dex: 300,
    		ads: [
    			84,
    			79,
    			137
    		]
    	},
    	{
    		dex: 301,
    		ads: [
    			132,
    			127,
    			172
    		]
    	},
    	{
    		dex: 302,
    		ads: [
    			141,
    			136,
    			137
    		]
    	},
    	{
    		dex: 303,
    		ads: [
    			155,
    			141,
    			137
    		]
    	},
    	{
    		dex: 304,
    		ads: [
    			121,
    			141,
    			137
    		]
    	},
    	{
    		dex: 305,
    		ads: [
    			158,
    			198,
    			155
    		]
    	},
    	{
    		dex: 306,
    		ads: [
    			198,
    			257,
    			172
    		]
    	},
    	{
    		dex: 307,
    		ads: [
    			78,
    			107,
    			102
    		]
    	},
    	{
    		dex: 308,
    		ads: [
    			121,
    			152,
    			155
    		]
    	},
    	{
    		dex: 309,
    		ads: [
    			123,
    			78,
    			120
    		]
    	},
    	{
    		dex: 310,
    		ads: [
    			215,
    			127,
    			172
    		]
    	},
    	{
    		dex: 311,
    		ads: [
    			167,
    			129,
    			155
    		]
    	},
    	{
    		dex: 312,
    		ads: [
    			147,
    			150,
    			155
    		]
    	},
    	{
    		dex: 313,
    		ads: [
    			143,
    			166,
    			163
    		]
    	},
    	{
    		dex: 314,
    		ads: [
    			143,
    			166,
    			163
    		]
    	},
    	{
    		dex: 315,
    		ads: [
    			186,
    			131,
    			137
    		]
    	},
    	{
    		dex: 316,
    		ads: [
    			80,
    			99,
    			172
    		]
    	},
    	{
    		dex: 317,
    		ads: [
    			140,
    			159,
    			225
    		]
    	},
    	{
    		dex: 318,
    		ads: [
    			171,
    			39,
    			128
    		]
    	},
    	{
    		dex: 319,
    		ads: [
    			243,
    			83,
    			172
    		]
    	},
    	{
    		dex: 320,
    		ads: [
    			136,
    			68,
    			277
    		]
    	},
    	{
    		dex: 321,
    		ads: [
    			175,
    			87,
    			347
    		]
    	},
    	{
    		dex: 322,
    		ads: [
    			119,
    			79,
    			155
    		]
    	},
    	{
    		dex: 323,
    		ads: [
    			194,
    			136,
    			172
    		]
    	},
    	{
    		dex: 324,
    		ads: [
    			151,
    			203,
    			172
    		]
    	},
    	{
    		dex: 325,
    		ads: [
    			125,
    			122,
    			155
    		]
    	},
    	{
    		dex: 326,
    		ads: [
    			171,
    			188,
    			190
    		]
    	},
    	{
    		dex: 327,
    		ads: [
    			116,
    			116,
    			155
    		]
    	},
    	{
    		dex: 328,
    		ads: [
    			162,
    			78,
    			128
    		]
    	},
    	{
    		dex: 329,
    		ads: [
    			134,
    			99,
    			137
    		]
    	},
    	{
    		dex: 330,
    		ads: [
    			205,
    			168,
    			190
    		]
    	},
    	{
    		dex: 331,
    		ads: [
    			156,
    			74,
    			137
    		]
    	},
    	{
    		dex: 332,
    		ads: [
    			221,
    			115,
    			172
    		]
    	},
    	{
    		dex: 333,
    		ads: [
    			76,
    			132,
    			128
    		]
    	},
    	{
    		dex: 334,
    		ads: [
    			141,
    			201,
    			181
    		]
    	},
    	{
    		dex: 335,
    		ads: [
    			222,
    			124,
    			177
    		]
    	},
    	{
    		dex: 336,
    		ads: [
    			196,
    			118,
    			177
    		]
    	},
    	{
    		dex: 337,
    		ads: [
    			178,
    			153,
    			207
    		]
    	},
    	{
    		dex: 338,
    		ads: [
    			178,
    			153,
    			207
    		]
    	},
    	{
    		dex: 339,
    		ads: [
    			93,
    			82,
    			137
    		]
    	},
    	{
    		dex: 340,
    		ads: [
    			151,
    			141,
    			242
    		]
    	},
    	{
    		dex: 341,
    		ads: [
    			141,
    			99,
    			125
    		]
    	},
    	{
    		dex: 342,
    		ads: [
    			224,
    			142,
    			160
    		]
    	},
    	{
    		dex: 343,
    		ads: [
    			77,
    			124,
    			120
    		]
    	},
    	{
    		dex: 344,
    		ads: [
    			140,
    			229,
    			155
    		]
    	},
    	{
    		dex: 345,
    		ads: [
    			105,
    			150,
    			165
    		]
    	},
    	{
    		dex: 346,
    		ads: [
    			152,
    			194,
    			200
    		]
    	},
    	{
    		dex: 347,
    		ads: [
    			176,
    			100,
    			128
    		]
    	},
    	{
    		dex: 348,
    		ads: [
    			222,
    			174,
    			181
    		]
    	},
    	{
    		dex: 349,
    		ads: [
    			29,
    			85,
    			85
    		]
    	},
    	{
    		dex: 350,
    		ads: [
    			192,
    			219,
    			216
    		]
    	},
    	{
    		dex: 351,
    		ads: [
    			139,
    			139,
    			172
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 351,
    		ads: [
    			139,
    			139,
    			172
    		],
    		isotope: "rainy"
    	},
    	{
    		dex: 351,
    		ads: [
    			139,
    			139,
    			172
    		],
    		isotope: "snowy"
    	},
    	{
    		dex: 351,
    		ads: [
    			139,
    			139,
    			172
    		],
    		isotope: "sunny"
    	},
    	{
    		dex: 352,
    		ads: [
    			161,
    			189,
    			155
    		]
    	},
    	{
    		dex: 353,
    		ads: [
    			138,
    			65,
    			127
    		]
    	},
    	{
    		dex: 354,
    		ads: [
    			218,
    			126,
    			162
    		]
    	},
    	{
    		dex: 355,
    		ads: [
    			70,
    			162,
    			85
    		]
    	},
    	{
    		dex: 356,
    		ads: [
    			124,
    			234,
    			120
    		]
    	},
    	{
    		dex: 357,
    		ads: [
    			136,
    			163,
    			223
    		]
    	},
    	{
    		dex: 358,
    		ads: [
    			175,
    			170,
    			181
    		]
    	},
    	{
    		dex: 359,
    		ads: [
    			246,
    			120,
    			163
    		]
    	},
    	{
    		dex: 360,
    		ads: [
    			41,
    			86,
    			216
    		]
    	},
    	{
    		dex: 361,
    		ads: [
    			95,
    			95,
    			137
    		]
    	},
    	{
    		dex: 362,
    		ads: [
    			162,
    			162,
    			190
    		]
    	},
    	{
    		dex: 363,
    		ads: [
    			95,
    			90,
    			172
    		]
    	},
    	{
    		dex: 364,
    		ads: [
    			137,
    			132,
    			207
    		]
    	},
    	{
    		dex: 365,
    		ads: [
    			182,
    			176,
    			242
    		]
    	},
    	{
    		dex: 366,
    		ads: [
    			133,
    			135,
    			111
    		]
    	},
    	{
    		dex: 367,
    		ads: [
    			197,
    			179,
    			146
    		]
    	},
    	{
    		dex: 368,
    		ads: [
    			211,
    			179,
    			146
    		]
    	},
    	{
    		dex: 369,
    		ads: [
    			162,
    			203,
    			225
    		]
    	},
    	{
    		dex: 370,
    		ads: [
    			81,
    			128,
    			125
    		]
    	},
    	{
    		dex: 371,
    		ads: [
    			134,
    			93,
    			128
    		]
    	},
    	{
    		dex: 372,
    		ads: [
    			172,
    			155,
    			163
    		]
    	},
    	{
    		dex: 373,
    		ads: [
    			277,
    			168,
    			216
    		]
    	},
    	{
    		dex: 374,
    		ads: [
    			96,
    			132,
    			120
    		]
    	},
    	{
    		dex: 375,
    		ads: [
    			138,
    			176,
    			155
    		]
    	},
    	{
    		dex: 376,
    		ads: [
    			257,
    			228,
    			190
    		]
    	},
    	{
    		dex: 377,
    		ads: [
    			179,
    			309,
    			190
    		]
    	},
    	{
    		dex: 378,
    		ads: [
    			179,
    			309,
    			190
    		]
    	},
    	{
    		dex: 379,
    		ads: [
    			143,
    			285,
    			190
    		]
    	},
    	{
    		dex: 380,
    		ads: [
    			228,
    			246,
    			190
    		]
    	},
    	{
    		dex: 381,
    		ads: [
    			268,
    			212,
    			190
    		]
    	},
    	{
    		dex: 382,
    		ads: [
    			270,
    			228,
    			205
    		]
    	},
    	{
    		dex: 383,
    		ads: [
    			270,
    			228,
    			205
    		]
    	},
    	{
    		dex: 384,
    		ads: [
    			284,
    			170,
    			213
    		]
    	},
    	{
    		dex: 385,
    		ads: [
    			210,
    			210,
    			225
    		]
    	},
    	{
    		dex: 386,
    		ads: [
    			414,
    			46,
    			137
    		],
    		isotope: "attack"
    	},
    	{
    		dex: 386,
    		ads: [
    			144,
    			330,
    			137
    		],
    		isotope: "defense"
    	},
    	{
    		dex: 386,
    		ads: [
    			345,
    			115,
    			137
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 386,
    		ads: [
    			230,
    			218,
    			137
    		],
    		isotope: "speed"
    	},
    	{
    		dex: 387,
    		ads: [
    			119,
    			110,
    			146
    		]
    	},
    	{
    		dex: 388,
    		ads: [
    			157,
    			143,
    			181
    		]
    	},
    	{
    		dex: 389,
    		ads: [
    			202,
    			188,
    			216
    		]
    	},
    	{
    		dex: 390,
    		ads: [
    			113,
    			86,
    			127
    		]
    	},
    	{
    		dex: 391,
    		ads: [
    			158,
    			105,
    			162
    		]
    	},
    	{
    		dex: 392,
    		ads: [
    			222,
    			151,
    			183
    		]
    	},
    	{
    		dex: 393,
    		ads: [
    			112,
    			102,
    			142
    		]
    	},
    	{
    		dex: 394,
    		ads: [
    			150,
    			139,
    			162
    		]
    	},
    	{
    		dex: 395,
    		ads: [
    			210,
    			186,
    			197
    		]
    	},
    	{
    		dex: 396,
    		ads: [
    			101,
    			58,
    			120
    		]
    	},
    	{
    		dex: 397,
    		ads: [
    			142,
    			94,
    			146
    		]
    	},
    	{
    		dex: 398,
    		ads: [
    			234,
    			140,
    			198
    		]
    	},
    	{
    		dex: 399,
    		ads: [
    			80,
    			73,
    			153
    		]
    	},
    	{
    		dex: 400,
    		ads: [
    			162,
    			119,
    			188
    		]
    	},
    	{
    		dex: 401,
    		ads: [
    			45,
    			74,
    			114
    		]
    	},
    	{
    		dex: 402,
    		ads: [
    			160,
    			100,
    			184
    		]
    	},
    	{
    		dex: 403,
    		ads: [
    			117,
    			64,
    			128
    		]
    	},
    	{
    		dex: 404,
    		ads: [
    			159,
    			95,
    			155
    		]
    	},
    	{
    		dex: 405,
    		ads: [
    			232,
    			156,
    			190
    		]
    	},
    	{
    		dex: 406,
    		ads: [
    			91,
    			109,
    			120
    		]
    	},
    	{
    		dex: 407,
    		ads: [
    			243,
    			185,
    			155
    		]
    	},
    	{
    		dex: 408,
    		ads: [
    			218,
    			71,
    			167
    		]
    	},
    	{
    		dex: 409,
    		ads: [
    			295,
    			109,
    			219
    		]
    	},
    	{
    		dex: 410,
    		ads: [
    			76,
    			195,
    			102
    		]
    	},
    	{
    		dex: 411,
    		ads: [
    			94,
    			286,
    			155
    		]
    	},
    	{
    		dex: 412,
    		ads: [
    			53,
    			83,
    			120
    		],
    		isotope: "plant"
    	},
    	{
    		dex: 412,
    		ads: [
    			53,
    			83,
    			120
    		],
    		isotope: "sandy"
    	},
    	{
    		dex: 412,
    		ads: [
    			53,
    			83,
    			120
    		],
    		isotope: "trash"
    	},
    	{
    		dex: 413,
    		ads: [
    			141,
    			180,
    			155
    		],
    		isotope: "plant"
    	},
    	{
    		dex: 413,
    		ads: [
    			141,
    			180,
    			155
    		],
    		isotope: "sandy"
    	},
    	{
    		dex: 413,
    		ads: [
    			127,
    			175,
    			155
    		],
    		isotope: "trash"
    	},
    	{
    		dex: 414,
    		ads: [
    			185,
    			98,
    			172
    		]
    	},
    	{
    		dex: 415,
    		ads: [
    			59,
    			83,
    			102
    		]
    	},
    	{
    		dex: 416,
    		ads: [
    			149,
    			190,
    			172
    		]
    	},
    	{
    		dex: 417,
    		ads: [
    			94,
    			172,
    			155
    		]
    	},
    	{
    		dex: 418,
    		ads: [
    			132,
    			67,
    			146
    		]
    	},
    	{
    		dex: 419,
    		ads: [
    			221,
    			114,
    			198
    		]
    	},
    	{
    		dex: 420,
    		ads: [
    			108,
    			92,
    			128
    		]
    	},
    	{
    		dex: 421,
    		ads: [
    			170,
    			153,
    			172
    		],
    		isotope: "overcast"
    	},
    	{
    		dex: 421,
    		ads: [
    			170,
    			153,
    			172
    		],
    		isotope: "sunny"
    	},
    	{
    		dex: 422,
    		ads: [
    			103,
    			105,
    			183
    		],
    		isotope: "east_sea"
    	},
    	{
    		dex: 422,
    		ads: [
    			103,
    			105,
    			183
    		],
    		isotope: "west_sea"
    	},
    	{
    		dex: 423,
    		ads: [
    			169,
    			143,
    			244
    		],
    		isotope: "east_sea"
    	},
    	{
    		dex: 423,
    		ads: [
    			169,
    			143,
    			244
    		],
    		isotope: "west_sea"
    	},
    	{
    		dex: 424,
    		ads: [
    			205,
    			143,
    			181
    		]
    	},
    	{
    		dex: 425,
    		ads: [
    			117,
    			80,
    			207
    		]
    	},
    	{
    		dex: 426,
    		ads: [
    			180,
    			102,
    			312
    		]
    	},
    	{
    		dex: 427,
    		ads: [
    			130,
    			105,
    			146
    		]
    	},
    	{
    		dex: 428,
    		ads: [
    			156,
    			194,
    			163
    		]
    	},
    	{
    		dex: 429,
    		ads: [
    			211,
    			187,
    			155
    		]
    	},
    	{
    		dex: 430,
    		ads: [
    			243,
    			103,
    			225
    		]
    	},
    	{
    		dex: 431,
    		ads: [
    			109,
    			82,
    			135
    		]
    	},
    	{
    		dex: 432,
    		ads: [
    			172,
    			133,
    			174
    		]
    	},
    	{
    		dex: 433,
    		ads: [
    			114,
    			94,
    			128
    		]
    	},
    	{
    		dex: 434,
    		ads: [
    			121,
    			90,
    			160
    		]
    	},
    	{
    		dex: 435,
    		ads: [
    			184,
    			132,
    			230
    		]
    	},
    	{
    		dex: 436,
    		ads: [
    			43,
    			154,
    			149
    		]
    	},
    	{
    		dex: 437,
    		ads: [
    			161,
    			213,
    			167
    		]
    	},
    	{
    		dex: 438,
    		ads: [
    			124,
    			133,
    			137
    		]
    	},
    	{
    		dex: 439,
    		ads: [
    			125,
    			142,
    			85
    		]
    	},
    	{
    		dex: 440,
    		ads: [
    			25,
    			77,
    			225
    		]
    	},
    	{
    		dex: 441,
    		ads: [
    			183,
    			91,
    			183
    		]
    	},
    	{
    		dex: 442,
    		ads: [
    			169,
    			199,
    			137
    		]
    	},
    	{
    		dex: 443,
    		ads: [
    			124,
    			84,
    			151
    		]
    	},
    	{
    		dex: 444,
    		ads: [
    			172,
    			125,
    			169
    		]
    	},
    	{
    		dex: 445,
    		ads: [
    			261,
    			193,
    			239
    		]
    	},
    	{
    		dex: 446,
    		ads: [
    			137,
    			117,
    			286
    		]
    	},
    	{
    		dex: 447,
    		ads: [
    			127,
    			78,
    			120
    		]
    	},
    	{
    		dex: 448,
    		ads: [
    			236,
    			144,
    			172
    		]
    	},
    	{
    		dex: 449,
    		ads: [
    			124,
    			118,
    			169
    		]
    	},
    	{
    		dex: 450,
    		ads: [
    			201,
    			191,
    			239
    		]
    	},
    	{
    		dex: 451,
    		ads: [
    			93,
    			151,
    			120
    		]
    	},
    	{
    		dex: 452,
    		ads: [
    			180,
    			202,
    			172
    		]
    	},
    	{
    		dex: 453,
    		ads: [
    			116,
    			76,
    			134
    		]
    	},
    	{
    		dex: 454,
    		ads: [
    			211,
    			133,
    			195
    		]
    	},
    	{
    		dex: 455,
    		ads: [
    			187,
    			136,
    			179
    		]
    	},
    	{
    		dex: 456,
    		ads: [
    			96,
    			116,
    			135
    		]
    	},
    	{
    		dex: 457,
    		ads: [
    			142,
    			170,
    			170
    		]
    	},
    	{
    		dex: 458,
    		ads: [
    			105,
    			179,
    			128
    		]
    	},
    	{
    		dex: 459,
    		ads: [
    			115,
    			105,
    			155
    		]
    	},
    	{
    		dex: 460,
    		ads: [
    			178,
    			158,
    			207
    		]
    	},
    	{
    		dex: 461,
    		ads: [
    			243,
    			171,
    			172
    		]
    	},
    	{
    		dex: 462,
    		ads: [
    			238,
    			205,
    			172
    		]
    	},
    	{
    		dex: 463,
    		ads: [
    			161,
    			181,
    			242
    		]
    	},
    	{
    		dex: 464,
    		ads: [
    			241,
    			190,
    			251
    		]
    	},
    	{
    		dex: 465,
    		ads: [
    			207,
    			184,
    			225
    		]
    	},
    	{
    		dex: 466,
    		ads: [
    			249,
    			163,
    			181
    		]
    	},
    	{
    		dex: 467,
    		ads: [
    			247,
    			172,
    			181
    		]
    	},
    	{
    		dex: 468,
    		ads: [
    			225,
    			217,
    			198
    		]
    	},
    	{
    		dex: 469,
    		ads: [
    			231,
    			156,
    			200
    		]
    	},
    	{
    		dex: 470,
    		ads: [
    			216,
    			219,
    			163
    		]
    	},
    	{
    		dex: 471,
    		ads: [
    			238,
    			205,
    			163
    		]
    	},
    	{
    		dex: 472,
    		ads: [
    			185,
    			222,
    			181
    		]
    	},
    	{
    		dex: 473,
    		ads: [
    			247,
    			146,
    			242
    		]
    	},
    	{
    		dex: 474,
    		ads: [
    			264,
    			150,
    			198
    		]
    	},
    	{
    		dex: 475,
    		ads: [
    			237,
    			195,
    			169
    		]
    	},
    	{
    		dex: 476,
    		ads: [
    			135,
    			275,
    			155
    		]
    	},
    	{
    		dex: 477,
    		ads: [
    			180,
    			254,
    			128
    		]
    	},
    	{
    		dex: 478,
    		ads: [
    			171,
    			150,
    			172
    		]
    	},
    	{
    		dex: 479,
    		ads: [
    			204,
    			219,
    			137
    		],
    		isotope: "fan"
    	},
    	{
    		dex: 479,
    		ads: [
    			204,
    			219,
    			137
    		],
    		isotope: "frost"
    	},
    	{
    		dex: 479,
    		ads: [
    			204,
    			219,
    			137
    		],
    		isotope: "heat"
    	},
    	{
    		dex: 479,
    		ads: [
    			204,
    			219,
    			137
    		],
    		isotope: "mow"
    	},
    	{
    		dex: 479,
    		ads: [
    			185,
    			159,
    			137
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 479,
    		ads: [
    			204,
    			219,
    			137
    		],
    		isotope: "wash"
    	},
    	{
    		dex: 480,
    		ads: [
    			156,
    			270,
    			181
    		]
    	},
    	{
    		dex: 481,
    		ads: [
    			212,
    			212,
    			190
    		]
    	},
    	{
    		dex: 482,
    		ads: [
    			270,
    			151,
    			181
    		]
    	},
    	{
    		dex: 483,
    		ads: [
    			275,
    			211,
    			205
    		]
    	},
    	{
    		dex: 484,
    		ads: [
    			280,
    			215,
    			189
    		]
    	},
    	{
    		dex: 485,
    		ads: [
    			251,
    			213,
    			209
    		]
    	},
    	{
    		dex: 486,
    		ads: [
    			287,
    			210,
    			221
    		]
    	},
    	{
    		dex: 487,
    		ads: [
    			187,
    			225,
    			284
    		],
    		isotope: "altered"
    	},
    	{
    		dex: 487,
    		ads: [
    			225,
    			187,
    			284
    		],
    		isotope: "origin"
    	},
    	{
    		dex: 488,
    		ads: [
    			152,
    			258,
    			260
    		]
    	},
    	{
    		dex: 489,
    		ads: [
    			162,
    			162,
    			190
    		]
    	},
    	{
    		dex: 490,
    		ads: [
    			210,
    			210,
    			225
    		]
    	},
    	{
    		dex: 491,
    		ads: [
    			285,
    			198,
    			172
    		]
    	},
    	{
    		dex: 492,
    		ads: [
    			210,
    			210,
    			225
    		],
    		isotope: "land"
    	},
    	{
    		dex: 492,
    		ads: [
    			261,
    			166,
    			225
    		],
    		isotope: "sky"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "bug"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "dark"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "dragon"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "electric"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "fairy"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "fighting"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "fire"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "flying"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "ghost"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "grass"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "ground"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "ice"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "normal"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "poison"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "psychic"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "rock"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "steel"
    	},
    	{
    		dex: 493,
    		ads: [
    			238,
    			238,
    			237
    		],
    		isotope: "water"
    	},
    	{
    		dex: 808,
    		ads: [
    			118,
    			99,
    			130
    		]
    	},
    	{
    		dex: 809,
    		ads: [
    			226,
    			190,
    			264
    		]
    	}
    ];

    var names = {
    	"100": {
    	de: "Voltobal",
    	en: "Voltorb",
    	fr: "Voltorbe",
    	ja: "ビリリダマ",
    	kr: "찌리리공",
    	zh: "霹靂電球"
    },
    	"101": {
    	de: "Lektrobal",
    	en: "Electrode",
    	fr: "Électrode",
    	ja: "マルマイン",
    	kr: "붐볼",
    	zh: "頑皮雷彈"
    },
    	"102": {
    	de: "Owei",
    	en: "Exeggcute",
    	fr: "Noeunoeuf",
    	ja: "タマタマ",
    	kr: "아라리",
    	zh: "蛋蛋"
    },
    	"103": {
    	de: "Kokowei",
    	en: "Exeggutor",
    	fr: "Noadkoko",
    	ja: "ナッシー",
    	kr: "나시",
    	zh: "椰蛋樹"
    },
    	"104": {
    	de: "Tragosso",
    	en: "Cubone",
    	fr: "Osselait",
    	ja: "カラカラ",
    	kr: "탕구리",
    	zh: "卡拉卡拉"
    },
    	"105": {
    	de: "Knogga",
    	en: "Marowak",
    	fr: "Ossatueur",
    	ja: "ガラガラ",
    	kr: "텅구리",
    	zh: "嘎啦嘎啦"
    },
    	"106": {
    	de: "Kicklee",
    	en: "Hitmonlee",
    	fr: "Kicklee",
    	ja: "サワムラー",
    	kr: "시라소몬",
    	zh: "飛腿郎"
    },
    	"107": {
    	de: "Nockchan",
    	en: "Hitmonchan",
    	fr: "Tygnon",
    	ja: "エビワラー",
    	kr: "홍수몬",
    	zh: "快拳郎"
    },
    	"108": {
    	de: "Schlurp",
    	en: "Lickitung",
    	fr: "Excelangue",
    	ja: "ベロリンガ",
    	kr: "내루미",
    	zh: "大舌頭"
    },
    	"109": {
    	de: "Smogon",
    	en: "Koffing",
    	fr: "Smogo",
    	ja: "ドガース",
    	kr: "또가스",
    	zh: "瓦斯彈"
    },
    	"110": {
    	de: "Smogmog",
    	en: "Weezing",
    	fr: "Smogogo",
    	ja: "マタドガス",
    	kr: "또도가스",
    	zh: "雙彈瓦斯"
    },
    	"111": {
    	de: "Rihorn",
    	en: "Rhyhorn",
    	fr: "Rhinocorne",
    	ja: "サイホーン",
    	kr: "뿔카노",
    	zh: "獨角犀牛"
    },
    	"112": {
    	de: "Rizeros",
    	en: "Rhydon",
    	fr: "Rhinoferos",
    	ja: "サイドン",
    	kr: "코뿌리",
    	zh: "鑽角犀獸"
    },
    	"113": {
    	de: "Chaneira",
    	en: "Chansey",
    	fr: "Leveinard",
    	ja: "ラッキー",
    	kr: "럭키",
    	zh: "吉利蛋"
    },
    	"114": {
    	de: "Tangela",
    	en: "Tangela",
    	fr: "Saquedeneu",
    	ja: "モンジャラ",
    	kr: "덩쿠리",
    	zh: "蔓藤怪"
    },
    	"115": {
    	de: "Kangama",
    	en: "Kangaskhan",
    	fr: "Kangourex",
    	ja: "ガルーラ",
    	kr: "캥카",
    	zh: "袋獸"
    },
    	"116": {
    	de: "Seeper",
    	en: "Horsea",
    	fr: "Hypotrempe",
    	ja: "タッツー",
    	kr: "쏘드라",
    	zh: "墨海馬"
    },
    	"117": {
    	de: "Seemon",
    	en: "Seadra",
    	fr: "Hypocéan",
    	ja: "シードラ",
    	kr: "시드라",
    	zh: "海刺龍"
    },
    	"118": {
    	de: "Goldini",
    	en: "Goldeen",
    	fr: "Poissirène",
    	ja: "トサキント",
    	kr: "콘치",
    	zh: "角金魚"
    },
    	"119": {
    	de: "Golking",
    	en: "Seaking",
    	fr: "Poissoroy",
    	ja: "アズマオウ",
    	kr: "왕콘치",
    	zh: "金魚王"
    },
    	"120": {
    	de: "Sterndu",
    	en: "Staryu",
    	fr: "Stari",
    	ja: "ヒトデマン",
    	kr: "별가사리",
    	zh: "海星星"
    },
    	"121": {
    	de: "Starmie",
    	en: "Starmie",
    	fr: "Staross",
    	ja: "スターミー",
    	kr: "아쿠스타",
    	zh: "寶石海星"
    },
    	"122": {
    	de: "Pantimos",
    	en: "Mr. Mime",
    	fr: "M. Mime",
    	ja: "バリヤード",
    	kr: "마임맨",
    	zh: "魔牆人偶"
    },
    	"123": {
    	de: "Sichlor",
    	en: "Scyther",
    	fr: "Insécateur",
    	ja: "ストライク",
    	kr: "스라크",
    	zh: "飛天螳螂"
    },
    	"124": {
    	de: "Rossana",
    	en: "Jynx",
    	fr: "Lippoutou",
    	ja: "ルージュラ",
    	kr: "루주라",
    	zh: "迷唇姐"
    },
    	"125": {
    	de: "Elektek",
    	en: "Electabuzz",
    	fr: "Élektek",
    	ja: "エレブー",
    	kr: "에레브",
    	zh: "電擊獸"
    },
    	"126": {
    	de: "Magmar",
    	en: "Magmar",
    	fr: "Magmar",
    	ja: "ブーバー",
    	kr: "마그마",
    	zh: "鴨嘴火獸"
    },
    	"127": {
    	de: "Pinsir",
    	en: "Pinsir",
    	fr: "Scarabrute",
    	ja: "カイロス",
    	kr: "쁘사이저",
    	zh: "凱羅斯"
    },
    	"128": {
    	de: "Tauros",
    	en: "Tauros",
    	fr: "Tauros",
    	ja: "ケンタロス",
    	kr: "켄타로스",
    	zh: "肯泰羅"
    },
    	"129": {
    	de: "Karpador",
    	en: "Magikarp",
    	fr: "Magicarpe",
    	ja: "コイキング",
    	kr: "잉어킹",
    	zh: "鯉魚王"
    },
    	"130": {
    	de: "Garados",
    	en: "Gyarados",
    	fr: "Léviator",
    	ja: "ギャラドス",
    	kr: "갸라도스",
    	zh: "暴鯉龍"
    },
    	"131": {
    	de: "Lapras",
    	en: "Lapras",
    	fr: "Lokhlass",
    	ja: "ラプラス",
    	kr: "라프라스",
    	zh: "拉普拉斯"
    },
    	"132": {
    	de: "Ditto",
    	en: "Ditto",
    	fr: "Métamorph",
    	ja: "メタモン",
    	kr: "메타몽",
    	zh: "百變怪"
    },
    	"133": {
    	de: "Evoli",
    	en: "Eevee",
    	fr: "Évoli",
    	ja: "イーブイ",
    	kr: "이브이",
    	zh: "伊布"
    },
    	"134": {
    	de: "Aquana",
    	en: "Vaporeon",
    	fr: "Aquali",
    	ja: "シャワーズ",
    	kr: "샤미드",
    	zh: "水伊布"
    },
    	"135": {
    	de: "Blitza",
    	en: "Jolteon",
    	fr: "Voltali",
    	ja: "サンダース",
    	kr: "쥬피썬더",
    	zh: "雷伊布"
    },
    	"136": {
    	de: "Flamara",
    	en: "Flareon",
    	fr: "Pyroli",
    	ja: "ブースター",
    	kr: "부스터",
    	zh: "火伊布"
    },
    	"137": {
    	de: "Porygon",
    	en: "Porygon",
    	fr: "Porygon",
    	ja: "ポリゴン",
    	kr: "폴리곤",
    	zh: "多邊獸"
    },
    	"138": {
    	de: "Amonitas",
    	en: "Omanyte",
    	fr: "Amonita",
    	ja: "オムナイト",
    	kr: "암나이트",
    	zh: "菊石獸"
    },
    	"139": {
    	de: "Amoroso",
    	en: "Omastar",
    	fr: "Amonistar",
    	ja: "オムスター",
    	kr: "암스타",
    	zh: "多刺菊石獸"
    },
    	"140": {
    	de: "Kabuto",
    	en: "Kabuto",
    	fr: "Kabuto",
    	ja: "カブト",
    	kr: "투구",
    	zh: "化石盔"
    },
    	"141": {
    	de: "Kabutops",
    	en: "Kabutops",
    	fr: "Kabutops",
    	ja: "カブトプス",
    	kr: "투구푸스",
    	zh: "鐮刀盔"
    },
    	"142": {
    	de: "Aerodactyl",
    	en: "Aerodactyl",
    	fr: "Ptéra",
    	ja: "プテラ",
    	kr: "프테라",
    	zh: "化石翼龍"
    },
    	"143": {
    	de: "Relaxo",
    	en: "Snorlax",
    	fr: "Ronflex",
    	ja: "カビゴン",
    	kr: "잠만보",
    	zh: "卡比獸"
    },
    	"144": {
    	de: "Arktos",
    	en: "Articuno",
    	fr: "Artikodin",
    	ja: "フリーザー",
    	kr: "프리져",
    	zh: "急凍鳥"
    },
    	"145": {
    	de: "Zapdos",
    	en: "Zapdos",
    	fr: "Électhor",
    	ja: "サンダー",
    	kr: "썬더",
    	zh: "閃電鳥"
    },
    	"146": {
    	de: "Lavados",
    	en: "Moltres",
    	fr: "Sulfura",
    	ja: "ファイヤー",
    	kr: "파이어",
    	zh: "火焰鳥"
    },
    	"147": {
    	de: "Dratini",
    	en: "Dratini",
    	fr: "Minidraco",
    	ja: "ミニリュウ",
    	kr: "미뇽",
    	zh: "迷你龍"
    },
    	"148": {
    	de: "Dragonir",
    	en: "Dragonair",
    	fr: "Draco",
    	ja: "ハクリュー",
    	kr: "신뇽",
    	zh: "哈克龍"
    },
    	"149": {
    	de: "Dragoran",
    	en: "Dragonite",
    	fr: "Dracolosse",
    	ja: "カイリュー",
    	kr: "망나뇽",
    	zh: "快龍"
    },
    	"150": {
    	de: "Mewtu",
    	en: "Mewtwo",
    	fr: "Mewtwo",
    	ja: "ミュウツー",
    	kr: "뮤츠",
    	zh: "超夢"
    },
    	"151": {
    	de: "Mew",
    	en: "Mew",
    	fr: "Mew",
    	ja: "ミュウ",
    	kr: "뮤",
    	zh: "夢幻"
    },
    	"152": {
    	de: "Endivie",
    	en: "Chikorita",
    	fr: "Germignon",
    	ja: "チコリータ",
    	kr: "치코리타",
    	zh: "菊草葉"
    },
    	"153": {
    	de: "Lorblatt",
    	en: "Bayleef",
    	fr: "Macronium",
    	ja: "ベイリーフ",
    	kr: "베이리프",
    	zh: "月桂葉"
    },
    	"154": {
    	de: "Meganie",
    	en: "Meganium",
    	fr: "Méganium",
    	ja: "メガニウム",
    	kr: "메가니움",
    	zh: "大竺葵"
    },
    	"155": {
    	de: "Feurigel",
    	en: "Cyndaquil",
    	fr: "Héricendre",
    	ja: "ヒノアラシ",
    	kr: "브케인",
    	zh: "火球鼠"
    },
    	"156": {
    	de: "Igelavar",
    	en: "Quilava",
    	fr: "Feurisson",
    	ja: "マグマラシ",
    	kr: "마그케인",
    	zh: "火岩鼠"
    },
    	"157": {
    	de: "Tornupto",
    	en: "Typhlosion",
    	fr: "Typhlosion",
    	ja: "バクフーン",
    	kr: "블레이범",
    	zh: "火爆獸"
    },
    	"158": {
    	de: "Karnimani",
    	en: "Totodile",
    	fr: "Kaiminus",
    	ja: "ワニノコ",
    	kr: "리아코",
    	zh: "小鋸鱷"
    },
    	"159": {
    	de: "Tyracroc",
    	en: "Croconaw",
    	fr: "Crocrodil",
    	ja: "アリゲイツ",
    	kr: "엘리게이",
    	zh: "藍鱷"
    },
    	"160": {
    	de: "Impergator",
    	en: "Feraligatr",
    	fr: "Aligatueur",
    	ja: "オーダイル",
    	kr: "장크로다일",
    	zh: "大力鱷"
    },
    	"161": {
    	de: "Wiesor",
    	en: "Sentret",
    	fr: "Fouinette",
    	ja: "オタチ",
    	kr: "꼬리선",
    	zh: "尾立"
    },
    	"162": {
    	de: "Wiesenior",
    	en: "Furret",
    	fr: "Fouinar",
    	ja: "オオタチ",
    	kr: "다꼬리",
    	zh: "大尾立"
    },
    	"163": {
    	de: "Hoothoot",
    	en: "Hoothoot",
    	fr: "Hoothoot",
    	ja: "ホーホー",
    	kr: "부우부",
    	zh: "咕咕"
    },
    	"164": {
    	de: "Noctuh",
    	en: "Noctowl",
    	fr: "Noarfang",
    	ja: "ヨルノズク",
    	kr: "야부엉",
    	zh: "貓頭夜鷹"
    },
    	"165": {
    	de: "Ledyba",
    	en: "Ledyba",
    	fr: "Coxy",
    	ja: "レディバ",
    	kr: "레디바",
    	zh: "芭瓢蟲"
    },
    	"166": {
    	de: "Ledian",
    	en: "Ledian",
    	fr: "Coxyclaque",
    	ja: "レディアン",
    	kr: "레디안",
    	zh: "安瓢蟲"
    },
    	"167": {
    	de: "Webarak",
    	en: "Spinarak",
    	fr: "Mimigal",
    	ja: "イトマル",
    	kr: "페이검",
    	zh: "圓絲蛛"
    },
    	"168": {
    	de: "Ariados",
    	en: "Ariados",
    	fr: "Migalos",
    	ja: "アリアドス",
    	kr: "아리아도스",
    	zh: "阿利多斯"
    },
    	"169": {
    	de: "Iksbat",
    	en: "Crobat",
    	fr: "Nostenfer",
    	ja: "クロバット",
    	kr: "크로뱃",
    	zh: "叉字蝠"
    },
    	"170": {
    	de: "Lampi",
    	en: "Chinchou",
    	fr: "Loupio",
    	ja: "チョンチー",
    	kr: "초라기",
    	zh: "燈籠魚"
    },
    	"171": {
    	de: "Lanturn",
    	en: "Lanturn",
    	fr: "Lanturn",
    	ja: "ランターン",
    	kr: "랜턴",
    	zh: "電燈怪"
    },
    	"172": {
    	de: "Pichu",
    	en: "Pichu",
    	fr: "Pichu",
    	ja: "ピチュー",
    	kr: "피츄",
    	zh: "皮丘"
    },
    	"173": {
    	de: "Pii",
    	en: "Cleffa",
    	fr: "Mélo",
    	ja: "ピィ",
    	kr: "삐",
    	zh: "皮寶寶"
    },
    	"174": {
    	de: "Fluffeluff",
    	en: "Igglybuff",
    	fr: "Toudoudou",
    	ja: "ププリン",
    	kr: "푸푸린",
    	zh: "寶寶丁"
    },
    	"175": {
    	de: "Togepi",
    	en: "Togepi",
    	fr: "Togepi",
    	ja: "トゲピー",
    	kr: "토게피",
    	zh: "波克比"
    },
    	"176": {
    	de: "Togetic",
    	en: "Togetic",
    	fr: "Togetic",
    	ja: "トゲチック",
    	kr: "토게틱",
    	zh: "波克基古"
    },
    	"177": {
    	de: "Natu",
    	en: "Natu",
    	fr: "Natu",
    	ja: "ネイティ",
    	kr: "네이티",
    	zh: "天然雀"
    },
    	"178": {
    	de: "Xatu",
    	en: "Xatu",
    	fr: "Xatu",
    	ja: "ネイティオ",
    	kr: "네이티오",
    	zh: "天然鳥"
    },
    	"179": {
    	de: "Voltilamm",
    	en: "Mareep",
    	fr: "Wattouat",
    	ja: "メリープ",
    	kr: "메리프",
    	zh: "咩利羊"
    },
    	"180": {
    	de: "Waaty",
    	en: "Flaaffy",
    	fr: "Lainergie",
    	ja: "モココ",
    	kr: "보송송",
    	zh: "茸茸羊"
    },
    	"181": {
    	de: "Ampharos",
    	en: "Ampharos",
    	fr: "Pharamp",
    	ja: "デンリュウ",
    	kr: "전룡",
    	zh: "電龍"
    },
    	"182": {
    	de: "Blubella",
    	en: "Bellossom",
    	fr: "Joliflor",
    	ja: "キレイハナ",
    	kr: "아르코",
    	zh: "美麗花"
    },
    	"183": {
    	de: "Marill",
    	en: "Marill",
    	fr: "Marill",
    	ja: "マリル",
    	kr: "마릴",
    	zh: "瑪力露"
    },
    	"184": {
    	de: "Azumarill",
    	en: "Azumarill",
    	fr: "Azumarill",
    	ja: "マリルリ",
    	kr: "마릴리",
    	zh: "瑪力露麗"
    },
    	"185": {
    	de: "Mogelbaum",
    	en: "Sudowoodo",
    	fr: "Simularbre",
    	ja: "ウソッキー",
    	kr: "꼬지모",
    	zh: "樹才怪"
    },
    	"186": {
    	de: "Quaxo",
    	en: "Politoed",
    	fr: "Tarpaud",
    	ja: "ニョロトノ",
    	kr: "왕구리",
    	zh: "蚊香蛙皇"
    },
    	"187": {
    	de: "Hoppspross",
    	en: "Hoppip",
    	fr: "Granivol",
    	ja: "ハネッコ",
    	kr: "통통코",
    	zh: "毽子草"
    },
    	"188": {
    	de: "Hubelupf",
    	en: "Skiploom",
    	fr: "Floravol",
    	ja: "ポポッコ",
    	kr: "두코",
    	zh: "毽子花"
    },
    	"189": {
    	de: "Papungha",
    	en: "Jumpluff",
    	fr: "Cotovol",
    	ja: "ワタッコ",
    	kr: "솜솜코",
    	zh: "毽子棉"
    },
    	"190": {
    	de: "Griffel",
    	en: "Aipom",
    	fr: "Capumain",
    	ja: "エイパム",
    	kr: "에이팜",
    	zh: "長尾怪手"
    },
    	"191": {
    	de: "Sonnkern",
    	en: "Sunkern",
    	fr: "Tournegrin",
    	ja: "ヒマナッツ",
    	kr: "해너츠",
    	zh: "向日種子"
    },
    	"192": {
    	de: "Sonnflora",
    	en: "Sunflora",
    	fr: "Héliatronc",
    	ja: "キマワリ",
    	kr: "해루미",
    	zh: "向日花怪"
    },
    	"193": {
    	de: "Yanma",
    	en: "Yanma",
    	fr: "Yanma",
    	ja: "ヤンヤンマ",
    	kr: "왕자리",
    	zh: "蜻蜻蜓"
    },
    	"194": {
    	de: "Felino",
    	en: "Wooper",
    	fr: "Axoloto",
    	ja: "ウパー",
    	kr: "우파",
    	zh: "烏波"
    },
    	"195": {
    	de: "Morlord",
    	en: "Quagsire",
    	fr: "Maraiste",
    	ja: "ヌオー",
    	kr: "누오",
    	zh: "沼王"
    },
    	"196": {
    	de: "Psiana",
    	en: "Espeon",
    	fr: "Mentali",
    	ja: "エーフィ",
    	kr: "에브이",
    	zh: "太陽伊布"
    },
    	"197": {
    	de: "Nachtara",
    	en: "Umbreon",
    	fr: "Noctali",
    	ja: "ブラッキー",
    	kr: "블래키",
    	zh: "月亮伊布"
    },
    	"198": {
    	de: "Kramurx",
    	en: "Murkrow",
    	fr: "Cornèbre",
    	ja: "ヤミカラス",
    	kr: "니로우",
    	zh: "黑暗鴉"
    },
    	"199": {
    	de: "Laschoking",
    	en: "Slowking",
    	fr: "Roigada",
    	ja: "ヤドキング",
    	kr: "야도킹",
    	zh: "呆呆王"
    },
    	"200": {
    	de: "Traunfugil",
    	en: "Misdreavus",
    	fr: "Feuforêve",
    	ja: "ムウマ",
    	kr: "무우마",
    	zh: "夢妖"
    },
    	"201": {
    	de: "Icognito",
    	en: "Unown",
    	fr: "Zarbi",
    	ja: "アンノーン",
    	kr: "안농",
    	zh: "未知圖騰"
    },
    	"202": {
    	de: "Woingenau",
    	en: "Wobbuffet",
    	fr: "Qulbutoké",
    	ja: "ソーナンス",
    	kr: "마자용",
    	zh: "果然翁"
    },
    	"203": {
    	de: "Girafarig",
    	en: "Girafarig",
    	fr: "Girafarig",
    	ja: "キリンリキ",
    	kr: "키링키",
    	zh: "麒麟奇"
    },
    	"204": {
    	de: "Tannza",
    	en: "Pineco",
    	fr: "Pomdepik",
    	ja: "クヌギダマ",
    	kr: "피콘",
    	zh: "榛果球"
    },
    	"205": {
    	de: "Forstellka",
    	en: "Forretress",
    	fr: "Foretress",
    	ja: "フォレトス",
    	kr: "쏘콘",
    	zh: "佛烈托斯"
    },
    	"206": {
    	de: "Dummisel",
    	en: "Dunsparce",
    	fr: "Insolourdo",
    	ja: "ノコッチ",
    	kr: "노고치",
    	zh: "土龍弟弟"
    },
    	"207": {
    	de: "Skorgla",
    	en: "Gligar",
    	fr: "Scorplane",
    	ja: "グライガー",
    	kr: "글라이거",
    	zh: "天蠍"
    },
    	"208": {
    	de: "Stahlos",
    	en: "Steelix",
    	fr: "Steelix",
    	ja: "ハガネール",
    	kr: "강철톤",
    	zh: "大鋼蛇"
    },
    	"209": {
    	de: "Snubbull",
    	en: "Snubbull",
    	fr: "Snubbull",
    	ja: "ブルー",
    	kr: "블루",
    	zh: "布魯"
    },
    	"210": {
    	de: "Granbull",
    	en: "Granbull",
    	fr: "Granbull",
    	ja: "グランブル",
    	kr: "그랑블루",
    	zh: "布魯皇"
    },
    	"211": {
    	de: "Baldorfish",
    	en: "Qwilfish",
    	fr: "Qwilfish",
    	ja: "ハリーセン",
    	kr: "침바루",
    	zh: "千針魚"
    },
    	"212": {
    	de: "Scherox",
    	en: "Scizor",
    	fr: "Cizayox",
    	ja: "ハッサム",
    	kr: "핫삼",
    	zh: "巨鉗螳螂"
    },
    	"213": {
    	de: "Pottrott",
    	en: "Shuckle",
    	fr: "Caratroc",
    	ja: "ツボツボ",
    	kr: "단단지",
    	zh: "壺壺"
    },
    	"214": {
    	de: "Skaraborn",
    	en: "Heracross",
    	fr: "Scarhino",
    	ja: "ヘラクロス",
    	kr: "헤라크로스",
    	zh: "赫拉克羅斯"
    },
    	"215": {
    	de: "Sniebel",
    	en: "Sneasel",
    	fr: "Farfuret",
    	ja: "ニューラ",
    	kr: "포푸니",
    	zh: "狃拉"
    },
    	"216": {
    	de: "Teddiursa",
    	en: "Teddiursa",
    	fr: "Teddiursa",
    	ja: "ヒメグマ",
    	kr: "깜지곰",
    	zh: "熊寶寶"
    },
    	"217": {
    	de: "Ursaring",
    	en: "Ursaring",
    	fr: "Ursaring",
    	ja: "リングマ",
    	kr: "링곰",
    	zh: "圈圈熊"
    },
    	"218": {
    	de: "Schneckmag",
    	en: "Slugma",
    	fr: "Limagma",
    	ja: "マグマッグ",
    	kr: "마그마그",
    	zh: "熔岩蟲"
    },
    	"219": {
    	de: "Magcargo",
    	en: "Magcargo",
    	fr: "Volcaropod",
    	ja: "マグカルゴ",
    	kr: "마그카르고",
    	zh: "熔岩蝸牛"
    },
    	"220": {
    	de: "Quiekel",
    	en: "Swinub",
    	fr: "Marcacrin",
    	ja: "ウリムー",
    	kr: "꾸꾸리",
    	zh: "小山豬"
    },
    	"221": {
    	de: "Keifel",
    	en: "Piloswine",
    	fr: "Cochignon",
    	ja: "イノムー",
    	kr: "메꾸리",
    	zh: "長毛豬"
    },
    	"222": {
    	de: "Corasonn",
    	en: "Corsola",
    	fr: "Corayon",
    	ja: "サニーゴ",
    	kr: "코산호",
    	zh: "太陽珊瑚"
    },
    	"223": {
    	de: "Remoraid",
    	en: "Remoraid",
    	fr: "Rémoraid",
    	ja: "テッポウオ",
    	kr: "총어",
    	zh: "鐵炮魚"
    },
    	"224": {
    	de: "Octillery",
    	en: "Octillery",
    	fr: "Octillery",
    	ja: "オクタン",
    	kr: "대포무노",
    	zh: "章魚桶"
    },
    	"225": {
    	de: "Botogel",
    	en: "Delibird",
    	fr: "Cadoizo",
    	ja: "デリバード",
    	kr: "딜리버드",
    	zh: "信使鳥"
    },
    	"226": {
    	de: "Mantax",
    	en: "Mantine",
    	fr: "Démanta",
    	ja: "マンタイン",
    	kr: "만타인",
    	zh: "巨翅飛魚"
    },
    	"227": {
    	de: "Panzaeron",
    	en: "Skarmory",
    	fr: "Airmure",
    	ja: "エアームド",
    	kr: "무장조",
    	zh: "盔甲鳥"
    },
    	"228": {
    	de: "Hunduster",
    	en: "Houndour",
    	fr: "Malosse",
    	ja: "デルビル",
    	kr: "델빌",
    	zh: "戴魯比"
    },
    	"229": {
    	de: "Hundemon",
    	en: "Houndoom",
    	fr: "Démolosse",
    	ja: "ヘルガー",
    	kr: "헬가",
    	zh: "黑魯加"
    },
    	"230": {
    	de: "Seedraking",
    	en: "Kingdra",
    	fr: "Hyporoi",
    	ja: "キングドラ",
    	kr: "킹드라",
    	zh: "刺龍王"
    },
    	"231": {
    	de: "Phanpy",
    	en: "Phanpy",
    	fr: "Phanpy",
    	ja: "ゴマゾウ",
    	kr: "코코리",
    	zh: "小小象"
    },
    	"232": {
    	de: "Donphan",
    	en: "Donphan",
    	fr: "Donphan",
    	ja: "ドンファン",
    	kr: "코리갑",
    	zh: "頓甲"
    },
    	"233": {
    	de: "Porygon2",
    	en: "Porygon2",
    	fr: "Porygon2",
    	ja: "ポリゴン２",
    	kr: "폴리곤2",
    	zh: "多邊獸Ⅱ"
    },
    	"234": {
    	de: "Damhirplex",
    	en: "Stantler",
    	fr: "Cerfrousse",
    	ja: "オドシシ",
    	kr: "노라키",
    	zh: "驚角鹿"
    },
    	"235": {
    	de: "Farbeagle",
    	en: "Smeargle",
    	fr: "Queulorior",
    	ja: "ドーブル",
    	kr: "루브도",
    	zh: "圖圖犬"
    },
    	"236": {
    	de: "Rabauz",
    	en: "Tyrogue",
    	fr: "Debugant",
    	ja: "バルキー",
    	kr: "배루키",
    	zh: "無畏小子"
    },
    	"237": {
    	de: "Kapoera",
    	en: "Hitmontop",
    	fr: "Kapoera",
    	ja: "カポエラー",
    	kr: "카포에라",
    	zh: "戰舞郎"
    },
    	"238": {
    	de: "Kussilla",
    	en: "Smoochum",
    	fr: "Lippouti",
    	ja: "ムチュール",
    	kr: "뽀뽀라",
    	zh: "迷唇娃"
    },
    	"239": {
    	de: "Elekid",
    	en: "Elekid",
    	fr: "Élekid",
    	ja: "エレキッド",
    	kr: "에레키드",
    	zh: "電擊怪"
    },
    	"240": {
    	de: "Magby",
    	en: "Magby",
    	fr: "Magby",
    	ja: "ブビィ",
    	kr: "마그비",
    	zh: "鴨嘴寶寶"
    },
    	"241": {
    	de: "Miltank",
    	en: "Miltank",
    	fr: "Écrémeuh",
    	ja: "ミルタンク",
    	kr: "밀탱크",
    	zh: "大奶罐"
    },
    	"242": {
    	de: "Heiteira",
    	en: "Blissey",
    	fr: "Leuphorie",
    	ja: "ハピナス",
    	kr: "해피너스",
    	zh: "幸福蛋"
    },
    	"243": {
    	de: "Raikou",
    	en: "Raikou",
    	fr: "Raikou",
    	ja: "ライコウ",
    	kr: "라이코",
    	zh: "雷公"
    },
    	"244": {
    	de: "Entei",
    	en: "Entei",
    	fr: "Entei",
    	ja: "エンテイ",
    	kr: "앤테이",
    	zh: "炎帝"
    },
    	"245": {
    	de: "Suicune",
    	en: "Suicune",
    	fr: "Suicune",
    	ja: "スイクン",
    	kr: "스이쿤",
    	zh: "水君"
    },
    	"246": {
    	de: "Larvitar",
    	en: "Larvitar",
    	fr: "Embrylex",
    	ja: "ヨーギラス",
    	kr: "애버라스",
    	zh: "幼基拉斯"
    },
    	"247": {
    	de: "Pupitar",
    	en: "Pupitar",
    	fr: "Ymphect",
    	ja: "サナギラス",
    	kr: "데기라스",
    	zh: "沙基拉斯"
    },
    	"248": {
    	de: "Despotar",
    	en: "Tyranitar",
    	fr: "Tyranocif",
    	ja: "バンギラス",
    	kr: "마기라스",
    	zh: "班基拉斯"
    },
    	"249": {
    	de: "Lugia",
    	en: "Lugia",
    	fr: "Lugia",
    	ja: "ルギア",
    	kr: "루기아",
    	zh: "洛奇亞"
    },
    	"250": {
    	de: "Ho-Oh",
    	en: "Ho-Oh",
    	fr: "Ho-Oh",
    	ja: "ホウオウ",
    	kr: "칠색조",
    	zh: "鳳王"
    },
    	"251": {
    	de: "Celebi",
    	en: "Celebi",
    	fr: "Celebi",
    	ja: "セレビィ",
    	kr: "세레비",
    	zh: "時拉比"
    },
    	"252": {
    	de: "Geckarbor",
    	en: "Treecko",
    	fr: "Arcko",
    	ja: "キモリ",
    	kr: "나무지기",
    	zh: "木守宮"
    },
    	"253": {
    	de: "Reptain",
    	en: "Grovyle",
    	fr: "Massko",
    	ja: "ジュプトル",
    	kr: "나무돌이",
    	zh: "森林蜥蜴"
    },
    	"254": {
    	de: "Gewaldro",
    	en: "Sceptile",
    	fr: "Jungko",
    	ja: "ジュカイン",
    	kr: "나무킹",
    	zh: "蜥蜴王"
    },
    	"255": {
    	de: "Flemmli",
    	en: "Torchic",
    	fr: "Poussifeu",
    	ja: "アチャモ",
    	kr: "아차모",
    	zh: "火稚雞"
    },
    	"256": {
    	de: "Jungglut",
    	en: "Combusken",
    	fr: "Galifeu",
    	ja: "ワカシャモ",
    	kr: "영치코",
    	zh: "力壯雞"
    },
    	"257": {
    	de: "Lohgock",
    	en: "Blaziken",
    	fr: "Braségali",
    	ja: "バシャーモ",
    	kr: "번치코",
    	zh: "火焰雞"
    },
    	"258": {
    	de: "Hydropi",
    	en: "Mudkip",
    	fr: "Gobou",
    	ja: "ミズゴロウ",
    	kr: "물짱이",
    	zh: "水躍魚"
    },
    	"259": {
    	de: "Moorabbel",
    	en: "Marshtomp",
    	fr: "Flobio",
    	ja: "ヌマクロー",
    	kr: "늪짱이",
    	zh: "沼躍魚"
    },
    	"260": {
    	de: "Sumpex",
    	en: "Swampert",
    	fr: "Laggron",
    	ja: "ラグラージ",
    	kr: "대짱이",
    	zh: "巨沼怪"
    },
    	"261": {
    	de: "Fiffyen",
    	en: "Poochyena",
    	fr: "Medhyèna",
    	ja: "ポチエナ",
    	kr: "포챠나",
    	zh: "土狼犬"
    },
    	"262": {
    	de: "Magnayen",
    	en: "Mightyena",
    	fr: "Grahyèna",
    	ja: "グラエナ",
    	kr: "그라에나",
    	zh: "大狼犬"
    },
    	"263": {
    	de: "Zigzachs",
    	en: "Zigzagoon",
    	fr: "Zigzaton",
    	ja: "ジグザグマ",
    	kr: "지그제구리",
    	zh: "蛇紋熊"
    },
    	"264": {
    	de: "Geradaks",
    	en: "Linoone",
    	fr: "Linéon",
    	ja: "マッスグマ",
    	kr: "직구리",
    	zh: "直衝熊"
    },
    	"265": {
    	de: "Waumpel",
    	en: "Wurmple",
    	fr: "Chenipotte",
    	ja: "ケムッソ",
    	kr: "개무소",
    	zh: "刺尾蟲"
    },
    	"266": {
    	de: "Schaloko",
    	en: "Silcoon",
    	fr: "Armulys",
    	ja: "カラサリス",
    	kr: "실쿤",
    	zh: "甲殼繭"
    },
    	"267": {
    	de: "Papinella",
    	en: "Beautifly",
    	fr: "Charmillon",
    	ja: "アゲハント",
    	kr: "뷰티플라이",
    	zh: "狩獵鳳蝶"
    },
    	"268": {
    	de: "Panekon",
    	en: "Cascoon",
    	fr: "Blindalys",
    	ja: "マユルド",
    	kr: "카스쿤",
    	zh: "盾甲繭"
    },
    	"269": {
    	de: "Pudox",
    	en: "Dustox",
    	fr: "Papinox",
    	ja: "ドクケイル",
    	kr: "독케일",
    	zh: "毒粉蛾"
    },
    	"270": {
    	de: "Loturzel",
    	en: "Lotad",
    	fr: "Nénupiot",
    	ja: "ハスボー",
    	kr: "연꽃몬",
    	zh: "蓮葉童子"
    },
    	"271": {
    	de: "Lombrero",
    	en: "Lombre",
    	fr: "Lombre",
    	ja: "ハスブレロ",
    	kr: "로토스",
    	zh: "蓮帽小童"
    },
    	"272": {
    	de: "Kappalores",
    	en: "Ludicolo",
    	fr: "Ludicolo",
    	ja: "ルンパッパ",
    	kr: "로파파",
    	zh: "樂天河童"
    },
    	"273": {
    	de: "Samurzel",
    	en: "Seedot",
    	fr: "Grainipiot",
    	ja: "タネボー",
    	kr: "도토링",
    	zh: "橡實果"
    },
    	"274": {
    	de: "Blanas",
    	en: "Nuzleaf",
    	fr: "Pifeuil",
    	ja: "コノハナ",
    	kr: "잎새코",
    	zh: "長鼻葉"
    },
    	"275": {
    	de: "Tengulist",
    	en: "Shiftry",
    	fr: "Tengalice",
    	ja: "ダーテング",
    	kr: "다탱구",
    	zh: "狡猾天狗"
    },
    	"276": {
    	de: "Schwalbini",
    	en: "Taillow",
    	fr: "Nirondelle",
    	ja: "スバメ",
    	kr: "테일로",
    	zh: "傲骨燕"
    },
    	"277": {
    	de: "Schwalboss",
    	en: "Swellow",
    	fr: "Hélédelle",
    	ja: "オオスバメ",
    	kr: "스왈로",
    	zh: "大王燕"
    },
    	"278": {
    	de: "Wingull",
    	en: "Wingull",
    	fr: "Goélise",
    	ja: "キャモメ",
    	kr: "갈모매",
    	zh: "長翅鷗"
    },
    	"279": {
    	de: "Pelipper",
    	en: "Pelipper",
    	fr: "Bekipan",
    	ja: "ペリッパー",
    	kr: "패리퍼",
    	zh: "大嘴鷗"
    },
    	"280": {
    	de: "Trasla",
    	en: "Ralts",
    	fr: "Tarsal",
    	ja: "ラルトス",
    	kr: "랄토스",
    	zh: "拉魯拉絲"
    },
    	"281": {
    	de: "Kirlia",
    	en: "Kirlia",
    	fr: "Kirlia",
    	ja: "キルリア",
    	kr: "킬리아",
    	zh: "奇魯莉安"
    },
    	"282": {
    	de: "Guardevoir",
    	en: "Gardevoir",
    	fr: "Gardevoir",
    	ja: "サーナイト",
    	kr: "가디안",
    	zh: "沙奈朵"
    },
    	"283": {
    	de: "Gehweiher",
    	en: "Surskit",
    	fr: "Arakdo",
    	ja: "アメタマ",
    	kr: "비구술",
    	zh: "溜溜糖球"
    },
    	"284": {
    	de: "Maskeregen",
    	en: "Masquerain",
    	fr: "Maskadra",
    	ja: "アメモース",
    	kr: "비나방",
    	zh: "雨翅蛾"
    },
    	"285": {
    	de: "Knilz",
    	en: "Shroomish",
    	fr: "Balignon",
    	ja: "キノココ",
    	kr: "버섯꼬",
    	zh: "蘑蘑菇"
    },
    	"286": {
    	de: "Kapilz",
    	en: "Breloom",
    	fr: "Chapignon",
    	ja: "キノガッサ",
    	kr: "버섯모",
    	zh: "斗笠菇"
    },
    	"287": {
    	de: "Bummelz",
    	en: "Slakoth",
    	fr: "Parecool",
    	ja: "ナマケロ",
    	kr: "게을로",
    	zh: "懶人獺"
    },
    	"288": {
    	de: "Muntier",
    	en: "Vigoroth",
    	fr: "Vigoroth",
    	ja: "ヤルキモノ",
    	kr: "발바로",
    	zh: "過動猿"
    },
    	"289": {
    	de: "Letarking",
    	en: "Slaking",
    	fr: "Monaflèmit",
    	ja: "ケッキング",
    	kr: "게을킹",
    	zh: "請假王"
    },
    	"290": {
    	de: "Nincada",
    	en: "Nincada",
    	fr: "Ningale",
    	ja: "ツチニン",
    	kr: "토중몬",
    	zh: "土居忍士"
    },
    	"291": {
    	de: "Ninjask",
    	en: "Ninjask",
    	fr: "Ninjask",
    	ja: "テッカニン",
    	kr: "아이스크",
    	zh: "鐵面忍者"
    },
    	"292": {
    	de: "Ninjatom",
    	en: "Shedinja",
    	fr: "Munja",
    	ja: "ヌケニン",
    	kr: "껍질몬",
    	zh: "脫殼忍者"
    },
    	"293": {
    	de: "Flurmel",
    	en: "Whismur",
    	fr: "Chuchmur",
    	ja: "ゴニョニョ",
    	kr: "소곤룡",
    	zh: "咕妞妞"
    },
    	"294": {
    	de: "Krakeelo",
    	en: "Loudred",
    	fr: "Ramboum",
    	ja: "ドゴーム",
    	kr: "노공룡",
    	zh: "吼爆彈"
    },
    	"295": {
    	de: "Krawumms",
    	en: "Exploud",
    	fr: "Brouhabam",
    	ja: "バクオング",
    	kr: "폭음룡",
    	zh: "爆音怪"
    },
    	"296": {
    	de: "Makuhita",
    	en: "Makuhita",
    	fr: "Makuhita",
    	ja: "マクノシタ",
    	kr: "마크탕",
    	zh: "幕下力士"
    },
    	"297": {
    	de: "Hariyama",
    	en: "Hariyama",
    	fr: "Hariyama",
    	ja: "ハリテヤマ",
    	kr: "하리뭉",
    	zh: "鐵掌力士"
    },
    	"298": {
    	de: "Azurill",
    	en: "Azurill",
    	fr: "Azurill",
    	ja: "ルリリ",
    	kr: "루리리",
    	zh: "露力麗"
    },
    	"299": {
    	de: "Nasgnet",
    	en: "Nosepass",
    	fr: "Tarinor",
    	ja: "ノズパス",
    	kr: "코코파스",
    	zh: "朝北鼻"
    },
    	"300": {
    	de: "Eneco",
    	en: "Skitty",
    	fr: "Skitty",
    	ja: "エネコ",
    	kr: "에나비",
    	zh: "向尾喵"
    },
    	"301": {
    	de: "Enekoro",
    	en: "Delcatty",
    	fr: "Delcatty",
    	ja: "エネコロロ",
    	kr: "델케티",
    	zh: "優雅貓"
    },
    	"302": {
    	de: "Zobiris",
    	en: "Sableye",
    	fr: "Ténéfix",
    	ja: "ヤミラミ",
    	kr: "깜까미",
    	zh: "勾魂眼"
    },
    	"303": {
    	de: "Flunkifer",
    	en: "Mawile",
    	fr: "Mysdibule",
    	ja: "クチート",
    	kr: "입치트",
    	zh: "大嘴娃"
    },
    	"304": {
    	de: "Stollunior",
    	en: "Aron",
    	fr: "Galekid",
    	ja: "ココドラ",
    	kr: "가보리",
    	zh: "可可多拉"
    },
    	"305": {
    	de: "Stollrak",
    	en: "Lairon",
    	fr: "Galegon",
    	ja: "コドラ",
    	kr: "갱도라",
    	zh: "可多拉"
    },
    	"306": {
    	de: "Stolloss",
    	en: "Aggron",
    	fr: "Galeking",
    	ja: "ボスゴドラ",
    	kr: "보스로라",
    	zh: "波士可多拉"
    },
    	"307": {
    	de: "Meditie",
    	en: "Meditite",
    	fr: "Méditikka",
    	ja: "アサナン",
    	kr: "요가랑",
    	zh: "瑪沙那"
    },
    	"308": {
    	de: "Meditalis",
    	en: "Medicham",
    	fr: "Charmina",
    	ja: "チャーレム",
    	kr: "요가램",
    	zh: "恰雷姆"
    },
    	"309": {
    	de: "Frizelbliz",
    	en: "Electrike",
    	fr: "Dynavolt",
    	ja: "ラクライ",
    	kr: "썬더라이",
    	zh: "落雷獸"
    },
    	"310": {
    	de: "Voltenso",
    	en: "Manectric",
    	fr: "Élecsprint",
    	ja: "ライボルト",
    	kr: "썬더볼트",
    	zh: "雷電獸"
    },
    	"311": {
    	de: "Plusle",
    	en: "Plusle",
    	fr: "Posipi",
    	ja: "プラスル",
    	kr: "플러시",
    	zh: "正電拍拍"
    },
    	"312": {
    	de: "Minun",
    	en: "Minun",
    	fr: "Négapi",
    	ja: "マイナン",
    	kr: "마이농",
    	zh: "負電拍拍"
    },
    	"313": {
    	de: "Volbeat",
    	en: "Volbeat",
    	fr: "Muciole",
    	ja: "バルビート",
    	kr: "볼비트",
    	zh: "電螢蟲"
    },
    	"314": {
    	de: "Illumise",
    	en: "Illumise",
    	fr: "Lumivole",
    	ja: "イルミーゼ",
    	kr: "네오비트",
    	zh: "甜甜螢"
    },
    	"315": {
    	de: "Roselia",
    	en: "Roselia",
    	fr: "Rosélia",
    	ja: "ロゼリア",
    	kr: "로젤리아",
    	zh: "毒薔薇"
    },
    	"316": {
    	de: "Schluppuck",
    	en: "Gulpin",
    	fr: "Gloupti",
    	ja: "ゴクリン",
    	kr: "꼴깍몬",
    	zh: "溶食獸"
    },
    	"317": {
    	de: "Schlukwech",
    	en: "Swalot",
    	fr: "Avaltout",
    	ja: "マルノーム",
    	kr: "꿀꺽몬",
    	zh: "吞食獸"
    },
    	"318": {
    	de: "Kanivanha",
    	en: "Carvanha",
    	fr: "Carvanha",
    	ja: "キバニア",
    	kr: "샤프니아",
    	zh: "利牙魚"
    },
    	"319": {
    	de: "Tohaido",
    	en: "Sharpedo",
    	fr: "Sharpedo",
    	ja: "サメハダー",
    	kr: "샤크니아",
    	zh: "巨牙鯊"
    },
    	"320": {
    	de: "Wailmer",
    	en: "Wailmer",
    	fr: "Wailmer",
    	ja: "ホエルコ",
    	kr: "고래왕자",
    	zh: "吼吼鯨"
    },
    	"321": {
    	de: "Wailord",
    	en: "Wailord",
    	fr: "Wailord",
    	ja: "ホエルオー",
    	kr: "고래왕",
    	zh: "吼鯨王"
    },
    	"322": {
    	de: "Camaub",
    	en: "Numel",
    	fr: "Chamallot",
    	ja: "ドンメル",
    	kr: "둔타",
    	zh: "呆火駝"
    },
    	"323": {
    	de: "Camerupt",
    	en: "Camerupt",
    	fr: "Camérupt",
    	ja: "バクーダ",
    	kr: "폭타",
    	zh: "噴火駝"
    },
    	"324": {
    	de: "Qurtel",
    	en: "Torkoal",
    	fr: "Chartor",
    	ja: "コータス",
    	kr: "코터스",
    	zh: "煤炭龜"
    },
    	"325": {
    	de: "Spoink",
    	en: "Spoink",
    	fr: "Spoink",
    	ja: "バネブー",
    	kr: "피그점프",
    	zh: "跳跳豬"
    },
    	"326": {
    	de: "Groink",
    	en: "Grumpig",
    	fr: "Groret",
    	ja: "ブーピッグ",
    	kr: "피그킹",
    	zh: "噗噗豬"
    },
    	"327": {
    	de: "Pandir",
    	en: "Spinda",
    	fr: "Spinda",
    	ja: "パッチール",
    	kr: "얼루기",
    	zh: "晃晃斑"
    },
    	"328": {
    	de: "Knacklion",
    	en: "Trapinch",
    	fr: "Kraknoix",
    	ja: "ナックラー",
    	kr: "톱치",
    	zh: "大顎蟻"
    },
    	"329": {
    	de: "Vibrava",
    	en: "Vibrava",
    	fr: "Vibraninf",
    	ja: "ビブラーバ",
    	kr: "비브라바",
    	zh: "超音波幼蟲"
    },
    	"330": {
    	de: "Libelldra",
    	en: "Flygon",
    	fr: "Libégon",
    	ja: "フライゴン",
    	kr: "플라이곤",
    	zh: "沙漠蜻蜓"
    },
    	"331": {
    	de: "Tuska",
    	en: "Cacnea",
    	fr: "Cacnea",
    	ja: "サボネア",
    	kr: "선인왕",
    	zh: "刺球仙人掌"
    },
    	"332": {
    	de: "Noktuska",
    	en: "Cacturne",
    	fr: "Cacturne",
    	ja: "ノクタス",
    	kr: "밤선인",
    	zh: "夢歌仙人掌"
    },
    	"333": {
    	de: "Wablu",
    	en: "Swablu",
    	fr: "Tylton",
    	ja: "チルット",
    	kr: "파비코",
    	zh: "青綿鳥"
    },
    	"334": {
    	de: "Altaria",
    	en: "Altaria",
    	fr: "Altaria",
    	ja: "チルタリス",
    	kr: "파비코리",
    	zh: "七夕青鳥"
    },
    	"335": {
    	de: "Sengo",
    	en: "Zangoose",
    	fr: "Mangriff",
    	ja: "ザングース",
    	kr: "쟝고",
    	zh: "貓鼬斬"
    },
    	"336": {
    	de: "Vipitis",
    	en: "Seviper",
    	fr: "Séviper",
    	ja: "ハブネーク",
    	kr: "세비퍼",
    	zh: "飯匙蛇"
    },
    	"337": {
    	de: "Lunastein",
    	en: "Lunatone",
    	fr: "Séléroc",
    	ja: "ルナトーン",
    	kr: "루나톤",
    	zh: "月石"
    },
    	"338": {
    	de: "Sonnfel",
    	en: "Solrock",
    	fr: "Solaroc",
    	ja: "ソルロック",
    	kr: "솔록",
    	zh: "太陽岩"
    },
    	"339": {
    	de: "Schmerbe",
    	en: "Barboach",
    	fr: "Barloche",
    	ja: "ドジョッチ",
    	kr: "미꾸리",
    	zh: "泥泥鰍"
    },
    	"340": {
    	de: "Welsar",
    	en: "Whiscash",
    	fr: "Barbicha",
    	ja: "ナマズン",
    	kr: "메깅",
    	zh: "鯰魚王"
    },
    	"341": {
    	de: "Krebscorps",
    	en: "Corphish",
    	fr: "Écrapince",
    	ja: "ヘイガニ",
    	kr: "가재군",
    	zh: "龍蝦小兵"
    },
    	"342": {
    	de: "Krebutack",
    	en: "Crawdaunt",
    	fr: "Colhomard",
    	ja: "シザリガー",
    	kr: "가재장군",
    	zh: "鐵螯龍蝦"
    },
    	"343": {
    	de: "Puppance",
    	en: "Baltoy",
    	fr: "Balbuto",
    	ja: "ヤジロン",
    	kr: "오뚝군",
    	zh: "天秤偶"
    },
    	"344": {
    	de: "Lepumentas",
    	en: "Claydol",
    	fr: "Kaorine",
    	ja: "ネンドール",
    	kr: "점토도리",
    	zh: "念力土偶"
    },
    	"345": {
    	de: "Liliep",
    	en: "Lileep",
    	fr: "Lilia",
    	ja: "リリーラ",
    	kr: "릴링",
    	zh: "觸手百合"
    },
    	"346": {
    	de: "Wielie",
    	en: "Cradily",
    	fr: "Vacilys",
    	ja: "ユレイドル",
    	kr: "릴리요",
    	zh: "搖籃百合"
    },
    	"347": {
    	de: "Anorith",
    	en: "Anorith",
    	fr: "Anorith",
    	ja: "アノプス",
    	kr: "아노딥스",
    	zh: "太古羽蟲"
    },
    	"348": {
    	de: "Armaldo",
    	en: "Armaldo",
    	fr: "Armaldo",
    	ja: "アーマルド",
    	kr: "아말도",
    	zh: "太古盔甲"
    },
    	"349": {
    	de: "Barschwa",
    	en: "Feebas",
    	fr: "Barpau",
    	ja: "ヒンバス",
    	kr: "빈티나",
    	zh: "醜醜魚"
    },
    	"350": {
    	de: "Milotic",
    	en: "Milotic",
    	fr: "Milobellus",
    	ja: "ミロカロス",
    	kr: "밀로틱",
    	zh: "美納斯"
    },
    	"351": {
    	de: "Formeo",
    	en: "Castform",
    	fr: "Morphéo",
    	ja: "ポワルン",
    	kr: "캐스퐁",
    	zh: "飄浮泡泡"
    },
    	"352": {
    	de: "Kecleon",
    	en: "Kecleon",
    	fr: "Kecleon",
    	ja: "カクレオン",
    	kr: "켈리몬",
    	zh: "變隱龍"
    },
    	"353": {
    	de: "Shuppet",
    	en: "Shuppet",
    	fr: "Polichombr",
    	ja: "カゲボウズ",
    	kr: "어둠대신",
    	zh: "怨影娃娃"
    },
    	"354": {
    	de: "Banette",
    	en: "Banette",
    	fr: "Branette",
    	ja: "ジュペッタ",
    	kr: "다크펫",
    	zh: "詛咒娃娃"
    },
    	"355": {
    	de: "Zwirrlicht",
    	en: "Duskull",
    	fr: "Skelénox",
    	ja: "ヨマワル",
    	kr: "해골몽",
    	zh: "夜巡靈"
    },
    	"356": {
    	de: "Zwirrklop",
    	en: "Dusclops",
    	fr: "Téraclope",
    	ja: "サマヨール",
    	kr: "미라몽",
    	zh: "彷徨夜靈"
    },
    	"357": {
    	de: "Tropius",
    	en: "Tropius",
    	fr: "Tropius",
    	ja: "トロピウス",
    	kr: "트로피우스",
    	zh: "熱帶龍"
    },
    	"358": {
    	de: "Palimpalim",
    	en: "Chimecho",
    	fr: "Éoko",
    	ja: "チリーン",
    	kr: "치렁",
    	zh: "風鈴鈴"
    },
    	"359": {
    	de: "Absol",
    	en: "Absol",
    	fr: "Absol",
    	ja: "アブソル",
    	kr: "앱솔",
    	zh: "阿勃梭魯"
    },
    	"360": {
    	de: "Isso",
    	en: "Wynaut",
    	fr: "Okéoké",
    	ja: "ソーナノ",
    	kr: "마자",
    	zh: "小果然"
    },
    	"361": {
    	de: "Schneppke",
    	en: "Snorunt",
    	fr: "Stalgamin",
    	ja: "ユキワラシ",
    	kr: "눈꼬마",
    	zh: "雪童子"
    },
    	"362": {
    	de: "Firnontor",
    	en: "Glalie",
    	fr: "Oniglali",
    	ja: "オニゴーリ",
    	kr: "얼음귀신",
    	zh: "冰鬼護"
    },
    	"363": {
    	de: "Seemops",
    	en: "Spheal",
    	fr: "Obalie",
    	ja: "タマザラシ",
    	kr: "대굴레오",
    	zh: "海豹球"
    },
    	"364": {
    	de: "Seejong",
    	en: "Sealeo",
    	fr: "Phogleur",
    	ja: "トドグラー",
    	kr: "씨레오",
    	zh: "海魔獅"
    },
    	"365": {
    	de: "Walraisa",
    	en: "Walrein",
    	fr: "Kaimorse",
    	ja: "トドゼルガ",
    	kr: "씨카이저",
    	zh: "帝牙海獅"
    },
    	"366": {
    	de: "Perlu",
    	en: "Clamperl",
    	fr: "Coquiperl",
    	ja: "パールル",
    	kr: "진주몽",
    	zh: "珍珠貝"
    },
    	"367": {
    	de: "Aalabyss",
    	en: "Huntail",
    	fr: "Serpang",
    	ja: "ハンテール",
    	kr: "헌테일",
    	zh: "獵斑魚"
    },
    	"368": {
    	de: "Saganabyss",
    	en: "Gorebyss",
    	fr: "Rosabyss",
    	ja: "サクラビス",
    	kr: "분홍장이",
    	zh: "櫻花魚"
    },
    	"369": {
    	de: "Relicanth",
    	en: "Relicanth",
    	fr: "Relicanth",
    	ja: "ジーランス",
    	kr: "시라칸",
    	zh: "古空棘魚"
    },
    	"370": {
    	de: "Liebiskus",
    	en: "Luvdisc",
    	fr: "Lovdisc",
    	ja: "ラブカス",
    	kr: "사랑동이",
    	zh: "愛心魚"
    },
    	"371": {
    	de: "Kindwurm",
    	en: "Bagon",
    	fr: "Draby",
    	ja: "タツベイ",
    	kr: "아공이",
    	zh: "寶貝龍"
    },
    	"372": {
    	de: "Draschel",
    	en: "Shelgon",
    	fr: "Drackhaus",
    	ja: "コモルー",
    	kr: "쉘곤",
    	zh: "甲殼龍"
    },
    	"373": {
    	de: "Brutalanda",
    	en: "Salamence",
    	fr: "Drattak",
    	ja: "ボーマンダ",
    	kr: "보만다",
    	zh: "暴飛龍"
    },
    	"374": {
    	de: "Tanhel",
    	en: "Beldum",
    	fr: "Terhal",
    	ja: "ダンバル",
    	kr: "메탕",
    	zh: "鐵啞鈴"
    },
    	"375": {
    	de: "Metang",
    	en: "Metang",
    	fr: "Métang",
    	ja: "メタング",
    	kr: "메탕구",
    	zh: "金屬怪"
    },
    	"376": {
    	de: "Metagross",
    	en: "Metagross",
    	fr: "Métalosse",
    	ja: "メタグロス",
    	kr: "메타그로스",
    	zh: "巨金怪"
    },
    	"377": {
    	de: "Regirock",
    	en: "Regirock",
    	fr: "Regirock",
    	ja: "レジロック",
    	kr: "레지락",
    	zh: "雷吉洛克"
    },
    	"378": {
    	de: "Regice",
    	en: "Regice",
    	fr: "Regice",
    	ja: "レジアイス",
    	kr: "레지아이스",
    	zh: "雷吉艾斯"
    },
    	"379": {
    	de: "Registeel",
    	en: "Registeel",
    	fr: "Registeel",
    	ja: "レジスチル",
    	kr: "레지스틸",
    	zh: "雷吉斯奇魯"
    },
    	"380": {
    	de: "Latias",
    	en: "Latias",
    	fr: "Latias",
    	ja: "ラティアス",
    	kr: "라티아스",
    	zh: "拉帝亞斯"
    },
    	"381": {
    	de: "Latios",
    	en: "Latios",
    	fr: "Latios",
    	ja: "ラティオス",
    	kr: "라티오스",
    	zh: "拉帝歐斯"
    },
    	"382": {
    	de: "Kyogre",
    	en: "Kyogre",
    	fr: "Kyogre",
    	ja: "カイオーガ",
    	kr: "가이오가",
    	zh: "蓋歐卡"
    },
    	"383": {
    	de: "Groudon",
    	en: "Groudon",
    	fr: "Groudon",
    	ja: "グラードン",
    	kr: "그란돈",
    	zh: "固拉多"
    },
    	"384": {
    	de: "Rayquaza",
    	en: "Rayquaza",
    	fr: "Rayquaza",
    	ja: "レックウザ",
    	kr: "레쿠쟈",
    	zh: "烈空坐"
    },
    	"385": {
    	de: "Jirachi",
    	en: "Jirachi",
    	fr: "Jirachi",
    	ja: "ジラーチ",
    	kr: "지라치",
    	zh: "基拉祈"
    },
    	"386": {
    	de: "Deoxys",
    	en: "Deoxys",
    	fr: "Deoxys",
    	ja: "デオキシス",
    	kr: "테오키스",
    	zh: "代歐奇希斯"
    },
    	"387": {
    	de: "Chelast",
    	en: "Turtwig",
    	fr: "Tortipouss",
    	ja: "ナエトル",
    	kr: "모부기",
    	zh: "草苗龜"
    },
    	"388": {
    	de: "Chelcarain",
    	en: "Grotle",
    	fr: "Boskara",
    	ja: "ハヤシガメ",
    	kr: "수풀부기",
    	zh: "樹林龜"
    },
    	"389": {
    	de: "Chelterrar",
    	en: "Torterra",
    	fr: "Torterra",
    	ja: "ドダイトス",
    	kr: "토대부기",
    	zh: "土台龜"
    },
    	"390": {
    	de: "Panflam",
    	en: "Chimchar",
    	fr: "Ouisticram",
    	ja: "ヒコザル",
    	kr: "불꽃숭이",
    	zh: "小火焰猴"
    },
    	"391": {
    	de: "Panpyro",
    	en: "Monferno",
    	fr: "Chimpenfeu",
    	ja: "モウカザル",
    	kr: "파이숭이",
    	zh: "猛火猴"
    },
    	"392": {
    	de: "Panferno",
    	en: "Infernape",
    	fr: "Simiabraz",
    	ja: "ゴウカザル",
    	kr: "초염몽",
    	zh: "烈焰猴"
    },
    	"393": {
    	de: "Plinfa",
    	en: "Piplup",
    	fr: "Tiplouf",
    	ja: "ポッチャマ",
    	kr: "팽도리",
    	zh: "波加曼"
    },
    	"394": {
    	de: "Pliprin",
    	en: "Prinplup",
    	fr: "Prinplouf",
    	ja: "ポッタイシ",
    	kr: "팽태자",
    	zh: "波皇子"
    },
    	"395": {
    	de: "Impoleon",
    	en: "Empoleon",
    	fr: "Pingoléon",
    	ja: "エンペルト",
    	kr: "엠페르트",
    	zh: "帝王拿波"
    },
    	"396": {
    	de: "Staralili",
    	en: "Starly",
    	fr: "Étourmi",
    	ja: "ムックル",
    	kr: "찌르꼬",
    	zh: "姆克兒"
    },
    	"397": {
    	de: "Staravia",
    	en: "Staravia",
    	fr: "Étourvol",
    	ja: "ムクバード",
    	kr: "찌르버드",
    	zh: "姆克鳥"
    },
    	"398": {
    	de: "Staraptor",
    	en: "Staraptor",
    	fr: "Étouraptor",
    	ja: "ムクホーク",
    	kr: "찌르호크",
    	zh: "姆克鷹"
    },
    	"399": {
    	de: "Bidiza",
    	en: "Bidoof",
    	fr: "Keunotor",
    	ja: "ビッパ",
    	kr: "비버니",
    	zh: "大牙狸"
    },
    	"400": {
    	de: "Bidifas",
    	en: "Bibarel",
    	fr: "Castorno",
    	ja: "ビーダル",
    	kr: "비버통",
    	zh: "大尾狸"
    },
    	"401": {
    	de: "Zirpurze",
    	en: "Kricketot",
    	fr: "Crikzik",
    	ja: "コロボーシ",
    	kr: "귀뚤뚜기",
    	zh: "圓法師"
    },
    	"402": {
    	de: "Zirpeise",
    	en: "Kricketune",
    	fr: "Mélokrik",
    	ja: "コロトック",
    	kr: "귀뚤톡크",
    	zh: "音箱蟀"
    },
    	"403": {
    	de: "Sheinux",
    	en: "Shinx",
    	fr: "Lixy",
    	ja: "コリンク",
    	kr: "꼬링크",
    	zh: "小貓怪"
    },
    	"404": {
    	de: "Luxio",
    	en: "Luxio",
    	fr: "Luxio",
    	ja: "ルクシオ",
    	kr: "럭시오",
    	zh: "勒克貓"
    },
    	"405": {
    	de: "Luxtra",
    	en: "Luxray",
    	fr: "Luxray",
    	ja: "レントラー",
    	kr: "렌트라",
    	zh: "倫琴貓"
    },
    	"406": {
    	de: "Knospi",
    	en: "Budew",
    	fr: "Rozbouton",
    	ja: "スボミー",
    	kr: "꼬몽울",
    	zh: "含羞苞"
    },
    	"407": {
    	de: "Roserade",
    	en: "Roserade",
    	fr: "Roserade",
    	ja: "ロズレイド",
    	kr: "로즈레이드",
    	zh: "羅絲雷朵"
    },
    	"408": {
    	de: "Koknodon",
    	en: "Cranidos",
    	fr: "Kranidos",
    	ja: "ズガイドス",
    	kr: "두개도스",
    	zh: "頭蓋龍"
    },
    	"409": {
    	de: "Rameidon",
    	en: "Rampardos",
    	fr: "Charkos",
    	ja: "ラムパルド",
    	kr: "램펄드",
    	zh: "戰槌龍"
    },
    	"410": {
    	de: "Schilterus",
    	en: "Shieldon",
    	fr: "Dinoclier",
    	ja: "タテトプス",
    	kr: "방패톱스",
    	zh: "盾甲龍"
    },
    	"411": {
    	de: "Bollterus",
    	en: "Bastiodon",
    	fr: "Bastiodon",
    	ja: "トリデプス",
    	kr: "바리톱스",
    	zh: "護城龍"
    },
    	"412": {
    	de: "Burmy",
    	en: "Burmy",
    	fr: "Cheniti",
    	ja: "ミノムッチ",
    	kr: "도롱충이",
    	zh: "結草兒"
    },
    	"413": {
    	de: "Burmadame",
    	en: "Wormadam",
    	fr: "Cheniselle",
    	ja: "ミノマダム",
    	kr: "도롱마담",
    	zh: "結草貴婦"
    },
    	"414": {
    	de: "Moterpel",
    	en: "Mothim",
    	fr: "Papilord",
    	ja: "ガーメイル",
    	kr: "나메일",
    	zh: "紳士蛾"
    },
    	"415": {
    	de: "Wadribie",
    	en: "Combee",
    	fr: "Apitrini",
    	ja: "ミツハニー",
    	kr: "세꿀버리",
    	zh: "三蜜蜂"
    },
    	"416": {
    	de: "Honweisel",
    	en: "Vespiquen",
    	fr: "Apireine",
    	ja: "ビークイン",
    	kr: "비퀸",
    	zh: "蜂女王"
    },
    	"417": {
    	de: "Pachirisu",
    	en: "Pachirisu",
    	fr: "Pachirisu",
    	ja: "パチリス",
    	kr: "파치리스",
    	zh: "帕奇利茲"
    },
    	"418": {
    	de: "Bamelin",
    	en: "Buizel",
    	fr: "Mustébouée",
    	ja: "ブイゼル",
    	kr: "브이젤",
    	zh: "泳圈鼬"
    },
    	"419": {
    	de: "Bojelin",
    	en: "Floatzel",
    	fr: "Mustéflott",
    	ja: "フローゼル",
    	kr: "플로젤",
    	zh: "浮潛鼬"
    },
    	"420": {
    	de: "Kikugi",
    	en: "Cherubi",
    	fr: "Ceribou",
    	ja: "チェリンボ",
    	kr: "체리버",
    	zh: "櫻花寶"
    },
    	"421": {
    	de: "Kinoso",
    	en: "Cherrim",
    	fr: "Ceriflor",
    	ja: "チェリム",
    	kr: "체리꼬",
    	zh: "櫻花兒"
    },
    	"422": {
    	de: "Schalellos",
    	en: "Shellos",
    	fr: "Sancoki",
    	ja: "カラナクシ",
    	kr: "깝질무",
    	zh: "無殼海兔"
    },
    	"423": {
    	de: "Gastrodon",
    	en: "Gastrodon",
    	fr: "Tritosor",
    	ja: "トリトドン",
    	kr: "트리토돈",
    	zh: "海兔獸"
    },
    	"424": {
    	de: "Ambidiffel",
    	en: "Ambipom",
    	fr: "Capidextre",
    	ja: "エテボース",
    	kr: "겟핸보숭",
    	zh: "雙尾怪手"
    },
    	"425": {
    	de: "Driftlon",
    	en: "Drifloon",
    	fr: "Baudrive",
    	ja: "フワンテ",
    	kr: "흔들풍손",
    	zh: "飄飄球"
    },
    	"426": {
    	de: "Drifzepeli",
    	en: "Drifblim",
    	fr: "Grodrive",
    	ja: "フワライド",
    	kr: "둥실라이드",
    	zh: "隨風球"
    },
    	"427": {
    	de: "Haspiror",
    	en: "Buneary",
    	fr: "Laporeille",
    	ja: "ミミロル",
    	kr: "이어롤",
    	zh: "捲捲耳"
    },
    	"428": {
    	de: "Schlapor",
    	en: "Lopunny",
    	fr: "Lockpin",
    	ja: "ミミロップ",
    	kr: "이어롭",
    	zh: "長耳兔"
    },
    	"429": {
    	de: "Traunmagil",
    	en: "Mismagius",
    	fr: "Magirêve",
    	ja: "ムウマージ",
    	kr: "무우마직",
    	zh: "夢妖魔"
    },
    	"430": {
    	de: "Kramshef",
    	en: "Honchkrow",
    	fr: "Corboss",
    	ja: "ドンカラス",
    	kr: "돈크로우",
    	zh: "烏鴉頭頭"
    },
    	"431": {
    	de: "Charmian",
    	en: "Glameow",
    	fr: "Chaglam",
    	ja: "ニャルマー",
    	kr: "나옹마",
    	zh: "魅力喵"
    },
    	"432": {
    	de: "Shnurgarst",
    	en: "Purugly",
    	fr: "Chaffreux",
    	ja: "ブニャット",
    	kr: "몬냥이",
    	zh: "東施喵"
    },
    	"433": {
    	de: "Klingplim",
    	en: "Chingling",
    	fr: "Korillon",
    	ja: "リーシャン",
    	kr: "랑딸랑",
    	zh: "鈴鐺響"
    },
    	"434": {
    	de: "Skunkapuh",
    	en: "Stunky",
    	fr: "Moufouette",
    	ja: "スカンプー",
    	kr: "스컹뿡",
    	zh: "臭鼬噗"
    },
    	"435": {
    	de: "Skuntank",
    	en: "Skuntank",
    	fr: "Moufflair",
    	ja: "スカタンク",
    	kr: "스컹탱크",
    	zh: "坦克臭鼬"
    },
    	"436": {
    	de: "Bronzel",
    	en: "Bronzor",
    	fr: "Archéomire",
    	ja: "ドーミラー",
    	kr: "동미러",
    	zh: "銅鏡怪"
    },
    	"437": {
    	de: "Bronzong",
    	en: "Bronzong",
    	fr: "Archéodong",
    	ja: "ドータクン",
    	kr: "동탁군",
    	zh: "青銅鐘"
    },
    	"438": {
    	de: "Mobai",
    	en: "Bonsly",
    	fr: "Manzaï",
    	ja: "ウソハチ",
    	kr: "꼬지지",
    	zh: "盆才怪"
    },
    	"439": {
    	de: "Pantimimi",
    	en: "Mime Jr.",
    	fr: "Mime Jr.",
    	ja: "マネネ",
    	kr: "흉내내",
    	zh: "魔尼尼"
    },
    	"440": {
    	de: "Wonneira",
    	en: "Happiny",
    	fr: "Ptiravi",
    	ja: "ピンプク",
    	kr: "핑복",
    	zh: "小福蛋"
    },
    	"441": {
    	de: "Plaudagei",
    	en: "Chatot",
    	fr: "Pijako",
    	ja: "ペラップ",
    	kr: "페라페",
    	zh: "聒噪鳥"
    },
    	"442": {
    	de: "Kryppuk",
    	en: "Spiritomb",
    	fr: "Spiritomb",
    	ja: "ミカルゲ",
    	kr: "화강돌",
    	zh: "花岩怪"
    },
    	"443": {
    	de: "Kaumalat",
    	en: "Gible",
    	fr: "Griknot",
    	ja: "フカマル",
    	kr: "딥상어동",
    	zh: "圓陸鯊"
    },
    	"444": {
    	de: "Knarksel",
    	en: "Gabite",
    	fr: "Carmache",
    	ja: "ガバイト",
    	kr: "한바이트",
    	zh: "尖牙陸鯊"
    },
    	"445": {
    	de: "Knakrack",
    	en: "Garchomp",
    	fr: "Carchacrok",
    	ja: "ガブリアス",
    	kr: "한카리아스",
    	zh: "烈咬陸鯊"
    },
    	"446": {
    	de: "Mampfaxo",
    	en: "Munchlax",
    	fr: "Goinfrex",
    	ja: "ゴンベ",
    	kr: "먹고자",
    	zh: "小卡比獸"
    },
    	"447": {
    	de: "Riolu",
    	en: "Riolu",
    	fr: "Riolu",
    	ja: "リオル",
    	kr: "리오르",
    	zh: "利歐路"
    },
    	"448": {
    	de: "Lucario",
    	en: "Lucario",
    	fr: "Lucario",
    	ja: "ルカリオ",
    	kr: "루카리오",
    	zh: "路卡利歐"
    },
    	"449": {
    	de: "Hippopotas",
    	en: "Hippopotas",
    	fr: "Hippopotas",
    	ja: "ヒポポタス",
    	kr: "히포포타스",
    	zh: "沙河馬"
    },
    	"450": {
    	de: "Hippoterus",
    	en: "Hippowdon",
    	fr: "Hippodocus",
    	ja: "カバルドン",
    	kr: "하마돈",
    	zh: "河馬獸"
    },
    	"451": {
    	de: "Pionskora",
    	en: "Skorupi",
    	fr: "Rapion",
    	ja: "スコルピ",
    	kr: "스콜피",
    	zh: "鉗尾蠍"
    },
    	"452": {
    	de: "Piondragi",
    	en: "Drapion",
    	fr: "Drascore",
    	ja: "ドラピオン",
    	kr: "드래피온",
    	zh: "龍王蠍"
    },
    	"453": {
    	de: "Glibunkel",
    	en: "Croagunk",
    	fr: "Cradopaud",
    	ja: "グレッグル",
    	kr: "삐딱구리",
    	zh: "不良蛙"
    },
    	"454": {
    	de: "Toxiquak",
    	en: "Toxicroak",
    	fr: "Coatox",
    	ja: "ドクロッグ",
    	kr: "독개굴",
    	zh: "毒骷蛙"
    },
    	"455": {
    	de: "Venuflibis",
    	en: "Carnivine",
    	fr: "Vortente",
    	ja: "マスキッパ",
    	kr: "무스틈니",
    	zh: "尖牙籠"
    },
    	"456": {
    	de: "Finneon",
    	en: "Finneon",
    	fr: "Écayon",
    	ja: "ケイコウオ",
    	kr: "형광어",
    	zh: "螢光魚"
    },
    	"457": {
    	de: "Lumineon",
    	en: "Lumineon",
    	fr: "Luminéon",
    	ja: "ネオラント",
    	kr: "네오라이트",
    	zh: "霓虹魚"
    },
    	"458": {
    	de: "Mantirps",
    	en: "Mantyke",
    	fr: "Babimanta",
    	ja: "タマンタ",
    	kr: "타만타",
    	zh: "小球飛魚"
    },
    	"459": {
    	de: "Shnebedeck",
    	en: "Snover",
    	fr: "Blizzi",
    	ja: "ユキカブリ",
    	kr: "눈쓰개",
    	zh: "雪笠怪"
    },
    	"460": {
    	de: "Rexblisar",
    	en: "Abomasnow",
    	fr: "Blizzaroi",
    	ja: "ユキノオー",
    	kr: "눈설왕",
    	zh: "暴雪王"
    },
    	"461": {
    	de: "Snibunna",
    	en: "Weavile",
    	fr: "Dimoret",
    	ja: "マニューラ",
    	kr: "포푸니라",
    	zh: "瑪狃拉"
    },
    	"462": {
    	de: "Magnezone",
    	en: "Magnezone",
    	fr: "Magnézone",
    	ja: "ジバコイル",
    	kr: "자포코일",
    	zh: "自爆磁怪"
    },
    	"463": {
    	de: "Schlurplek",
    	en: "Lickilicky",
    	fr: "Coudlangue",
    	ja: "ベロベルト",
    	kr: "내룸벨트",
    	zh: "大舌舔"
    },
    	"464": {
    	de: "Rihornior",
    	en: "Rhyperior",
    	fr: "Rhinastoc",
    	ja: "ドサイドン",
    	kr: "거대코뿌리",
    	zh: "超甲狂犀"
    },
    	"465": {
    	de: "Tangoloss",
    	en: "Tangrowth",
    	fr: "Bouldeneu",
    	ja: "モジャンボ",
    	kr: "덩쿠림보",
    	zh: "巨蔓藤"
    },
    	"466": {
    	de: "Elevoltek",
    	en: "Electivire",
    	fr: "Élekable",
    	ja: "エレキブル",
    	kr: "에레키블",
    	zh: "電擊魔獸"
    },
    	"467": {
    	de: "Magbrant",
    	en: "Magmortar",
    	fr: "Maganon",
    	ja: "ブーバーン",
    	kr: "마그마번",
    	zh: "鴨嘴炎獸"
    },
    	"468": {
    	de: "Togekiss",
    	en: "Togekiss",
    	fr: "Togekiss",
    	ja: "トゲキッス",
    	kr: "토게키스",
    	zh: "波克基斯"
    },
    	"469": {
    	de: "Yanmega",
    	en: "Yanmega",
    	fr: "Yanméga",
    	ja: "メガヤンマ",
    	kr: "메가자리",
    	zh: "遠古巨蜓"
    },
    	"470": {
    	de: "Folipurba",
    	en: "Leafeon",
    	fr: "Phyllali",
    	ja: "リーフィア",
    	kr: "리피아",
    	zh: "葉伊布"
    },
    	"471": {
    	de: "Glaziola",
    	en: "Glaceon",
    	fr: "Givrali",
    	ja: "グレイシア",
    	kr: "글레이시아",
    	zh: "冰伊布"
    },
    	"472": {
    	de: "Skorgro",
    	en: "Gliscor",
    	fr: "Scorvol",
    	ja: "グライオン",
    	kr: "글라이온",
    	zh: "天蠍王"
    },
    	"473": {
    	de: "Mamutel",
    	en: "Mamoswine",
    	fr: "Mammochon",
    	ja: "マンムー",
    	kr: "맘모꾸리",
    	zh: "象牙豬"
    },
    	"474": {
    	de: "Porygon-Z",
    	en: "Porygon-Z",
    	fr: "Porygon-Z",
    	ja: "ポリゴンＺ",
    	kr: "폴리곤Z",
    	zh: "多邊獸Ｚ"
    },
    	"475": {
    	de: "Galagladi",
    	en: "Gallade",
    	fr: "Gallame",
    	ja: "エルレイド",
    	kr: "엘레이드",
    	zh: "艾路雷朵"
    },
    	"476": {
    	de: "Voluminas",
    	en: "Probopass",
    	fr: "Tarinorme",
    	ja: "ダイノーズ",
    	kr: "대코파스",
    	zh: "大朝北鼻"
    },
    	"477": {
    	de: "Zwirrfinst",
    	en: "Dusknoir",
    	fr: "Noctunoir",
    	ja: "ヨノワール",
    	kr: "야느와르몽",
    	zh: "黑夜魔靈"
    },
    	"478": {
    	de: "Frosdedje",
    	en: "Froslass",
    	fr: "Momartik",
    	ja: "ユキメノコ",
    	kr: "눈여아",
    	zh: "雪妖女"
    },
    	"479": {
    	de: "Rotom",
    	en: "Rotom",
    	fr: "Motisma",
    	ja: "ロトム",
    	kr: "로토무",
    	zh: "洛托姆"
    },
    	"480": {
    	de: "Selfe",
    	en: "Uxie",
    	fr: "Créhelf",
    	ja: "ユクシー",
    	kr: "유크시",
    	zh: "由克希"
    },
    	"481": {
    	de: "Vesprit",
    	en: "Mesprit",
    	fr: "Créfollet",
    	ja: "エムリット",
    	kr: "엠라이트",
    	zh: "艾姆利多"
    },
    	"482": {
    	de: "Tobutz",
    	en: "Azelf",
    	fr: "Créfadet",
    	ja: "アグノム",
    	kr: "아그놈",
    	zh: "亞克諾姆"
    },
    	"483": {
    	de: "Dialga",
    	en: "Dialga",
    	fr: "Dialga",
    	ja: "ディアルガ",
    	kr: "디아루가",
    	zh: "帝牙盧卡"
    },
    	"484": {
    	de: "Palkia",
    	en: "Palkia",
    	fr: "Palkia",
    	ja: "パルキア",
    	kr: "펄기아",
    	zh: "帕路奇亞"
    },
    	"485": {
    	de: "Heatran",
    	en: "Heatran",
    	fr: "Heatran",
    	ja: "ヒードラン",
    	kr: "히드런",
    	zh: "席多藍恩"
    },
    	"486": {
    	de: "Regigigas",
    	en: "Regigigas",
    	fr: "Regigigas",
    	ja: "レジギガス",
    	kr: "레지기가스",
    	zh: "雷吉奇卡斯"
    },
    	"487": {
    	de: "Giratina",
    	en: "Giratina",
    	fr: "Giratina",
    	ja: "ギラティナ",
    	kr: "기라티나",
    	zh: "騎拉帝納"
    },
    	"488": {
    	de: "Cresselia",
    	en: "Cresselia",
    	fr: "Cresselia",
    	ja: "クレセリア",
    	kr: "크레세리아",
    	zh: "克雷色利亞"
    },
    	"489": {
    	de: "Phione",
    	en: "Phione",
    	fr: "Phione",
    	ja: "フィオネ",
    	kr: "피오네",
    	zh: "霏歐納"
    },
    	"490": {
    	de: "Manaphy",
    	en: "Manaphy",
    	fr: "Manaphy",
    	ja: "マナフィ",
    	kr: "마나피",
    	zh: "瑪納霏"
    },
    	"491": {
    	de: "Darkrai",
    	en: "Darkrai",
    	fr: "Darkrai",
    	ja: "ダークライ",
    	kr: "다크라이",
    	zh: "達克萊伊"
    },
    	"492": {
    	de: "Shaymin",
    	en: "Shaymin",
    	fr: "Shaymin",
    	ja: "シェイミ",
    	kr: "쉐이미",
    	zh: "謝米"
    },
    	"493": {
    	de: "Arceus",
    	en: "Arceus",
    	fr: "Arceus",
    	ja: "アルセウス",
    	kr: "아르세우스",
    	zh: "阿爾宙斯"
    },
    	"808": {
    	de: "Meltan",
    	en: "Meltan",
    	fr: "Meltan",
    	ja: "メルタン",
    	kr: "멜탄",
    	zh: "美錄坦"
    },
    	"809": {
    	de: "Melmetal",
    	en: "Melmetal",
    	fr: "Melmetal",
    	ja: "メルメタル",
    	kr: "멜메탈",
    	zh: "美錄梅塔"
    },
    	"001": {
    	de: "Bisasam",
    	en: "Bulbasaur",
    	fr: "Bulbizarre",
    	ja: "フシギダネ",
    	kr: "이상해씨",
    	zh: "妙蛙種子"
    },
    	"002": {
    	de: "Bisaknosp",
    	en: "Ivysaur",
    	fr: "Herbizarre",
    	ja: "フシギソウ",
    	kr: "이상해풀",
    	zh: "妙蛙草"
    },
    	"003": {
    	de: "Bisaflor",
    	en: "Venusaur",
    	fr: "Florizarre",
    	ja: "フシギバナ",
    	kr: "이상해꽃",
    	zh: "妙蛙花"
    },
    	"004": {
    	de: "Glumanda",
    	en: "Charmander",
    	fr: "Salamèche",
    	ja: "ヒトカゲ",
    	kr: "파이리",
    	zh: "小火龍"
    },
    	"005": {
    	de: "Glutexo",
    	en: "Charmeleon",
    	fr: "Reptincel",
    	ja: "リザード",
    	kr: "리자드",
    	zh: "火恐龍"
    },
    	"006": {
    	de: "Glurak",
    	en: "Charizard",
    	fr: "Dracaufeu",
    	ja: "リザードン",
    	kr: "리자몽",
    	zh: "噴火龍"
    },
    	"007": {
    	de: "Schiggy",
    	en: "Squirtle",
    	fr: "Carapuce",
    	ja: "ゼニガメ",
    	kr: "꼬부기",
    	zh: "傑尼龜"
    },
    	"008": {
    	de: "Schillok",
    	en: "Wartortle",
    	fr: "Carabaffe",
    	ja: "カメール",
    	kr: "어니부기",
    	zh: "卡咪龜"
    },
    	"009": {
    	de: "Turtok",
    	en: "Blastoise",
    	fr: "Tortank",
    	ja: "カメックス",
    	kr: "거북왕",
    	zh: "水箭龜"
    },
    	"010": {
    	de: "Raupy",
    	en: "Caterpie",
    	fr: "Chenipan",
    	ja: "キャタピー",
    	kr: "캐터피",
    	zh: "綠毛蟲"
    },
    	"011": {
    	de: "Safcon",
    	en: "Metapod",
    	fr: "Chrysacier",
    	ja: "トランセル",
    	kr: "단데기",
    	zh: "鐵甲蛹"
    },
    	"012": {
    	de: "Smettbo",
    	en: "Butterfree",
    	fr: "Papilusion",
    	ja: "バタフリー",
    	kr: "버터플",
    	zh: "巴大蝶"
    },
    	"013": {
    	de: "Hornliu",
    	en: "Weedle",
    	fr: "Aspicot",
    	ja: "ビードル",
    	kr: "뿔충이",
    	zh: "獨角蟲"
    },
    	"014": {
    	de: "Kokuna",
    	en: "Kakuna",
    	fr: "Coconfort",
    	ja: "コクーン",
    	kr: "딱충이",
    	zh: "鐵殼蛹"
    },
    	"015": {
    	de: "Bibor",
    	en: "Beedrill",
    	fr: "Dardargnan",
    	ja: "スピアー",
    	kr: "독침붕",
    	zh: "大針蜂"
    },
    	"016": {
    	de: "Taubsi",
    	en: "Pidgey",
    	fr: "Roucool",
    	ja: "ポッポ",
    	kr: "구구",
    	zh: "波波"
    },
    	"017": {
    	de: "Tauboga",
    	en: "Pidgeotto",
    	fr: "Roucoups",
    	ja: "ピジョン",
    	kr: "피죤",
    	zh: "比比鳥"
    },
    	"018": {
    	de: "Tauboss",
    	en: "Pidgeot",
    	fr: "Roucarnage",
    	ja: "ピジョット",
    	kr: "피죤투",
    	zh: "大比鳥"
    },
    	"019": {
    	de: "Rattfratz",
    	en: "Rattata",
    	fr: "Rattata",
    	ja: "コラッタ",
    	kr: "꼬렛",
    	zh: "小拉達"
    },
    	"020": {
    	de: "Rattikarl",
    	en: "Raticate",
    	fr: "Rattatac",
    	ja: "ラッタ",
    	kr: "레트라",
    	zh: "拉達"
    },
    	"021": {
    	de: "Habitak",
    	en: "Spearow",
    	fr: "Piafabec",
    	ja: "オニスズメ",
    	kr: "깨비참",
    	zh: "烈雀"
    },
    	"022": {
    	de: "Ibitak",
    	en: "Fearow",
    	fr: "Rapasdepic",
    	ja: "オニドリル",
    	kr: "깨비드릴조",
    	zh: "大嘴雀"
    },
    	"023": {
    	de: "Rettan",
    	en: "Ekans",
    	fr: "Abo",
    	ja: "アーボ",
    	kr: "아보",
    	zh: "阿柏蛇"
    },
    	"024": {
    	de: "Arbok",
    	en: "Arbok",
    	fr: "Arbok",
    	ja: "アーボック",
    	kr: "아보크",
    	zh: "阿柏怪"
    },
    	"025": {
    	de: "Pikachu",
    	en: "Pikachu",
    	fr: "Pikachu",
    	ja: "ピカチュウ",
    	kr: "피카츄",
    	zh: "皮卡丘"
    },
    	"026": {
    	de: "Raichu",
    	en: "Raichu",
    	fr: "Raichu",
    	ja: "ライチュウ",
    	kr: "라이츄",
    	zh: "雷丘"
    },
    	"027": {
    	de: "Sandan",
    	en: "Sandshrew",
    	fr: "Sabelette",
    	ja: "サンド",
    	kr: "모래두지",
    	zh: "穿山鼠"
    },
    	"028": {
    	de: "Sandamer",
    	en: "Sandslash",
    	fr: "Sablaireau",
    	ja: "サンドパン",
    	kr: "고지",
    	zh: "穿山王"
    },
    	"029": {
    	de: "Nidoran♀",
    	en: "Nidoran♀",
    	fr: "Nidoran♀",
    	ja: "ニドラン♀",
    	kr: "니드런♀",
    	zh: "尼多蘭"
    },
    	"030": {
    	de: "Nidorina",
    	en: "Nidorina",
    	fr: "Nidorina",
    	ja: "ニドリーナ",
    	kr: "니드리나",
    	zh: "尼多娜"
    },
    	"031": {
    	de: "Nidoqueen",
    	en: "Nidoqueen",
    	fr: "Nidoqueen",
    	ja: "ニドクイン",
    	kr: "니드퀸",
    	zh: "尼多后"
    },
    	"032": {
    	de: "Nidoran♂",
    	en: "Nidoran♂",
    	fr: "Nidoran♂",
    	ja: "ニドラン♂",
    	kr: "니드런♂",
    	zh: "尼多朗"
    },
    	"033": {
    	de: "Nidorino",
    	en: "Nidorino",
    	fr: "Nidorino",
    	ja: "ニドリーノ",
    	kr: "니드리노",
    	zh: "尼多力諾"
    },
    	"034": {
    	de: "Nidoking",
    	en: "Nidoking",
    	fr: "Nidoking",
    	ja: "ニドキング",
    	kr: "니드킹",
    	zh: "尼多王"
    },
    	"035": {
    	de: "Piepi",
    	en: "Clefairy",
    	fr: "Mélofée",
    	ja: "ピッピ",
    	kr: "삐삐",
    	zh: "皮皮"
    },
    	"036": {
    	de: "Pixi",
    	en: "Clefable",
    	fr: "Mélodelfe",
    	ja: "ピクシー",
    	kr: "픽시",
    	zh: "皮可西"
    },
    	"037": {
    	de: "Vulpix",
    	en: "Vulpix",
    	fr: "Goupix",
    	ja: "ロコン",
    	kr: "식스테일",
    	zh: "六尾"
    },
    	"038": {
    	de: "Vulnona",
    	en: "Ninetales",
    	fr: "Feunard",
    	ja: "キュウコン",
    	kr: "나인테일",
    	zh: "九尾"
    },
    	"039": {
    	de: "Pummeluff",
    	en: "Jigglypuff",
    	fr: "Rondoudou",
    	ja: "プリン",
    	kr: "푸린",
    	zh: "胖丁"
    },
    	"040": {
    	de: "Knuddeluff",
    	en: "Wigglytuff",
    	fr: "Grodoudou",
    	ja: "プクリン",
    	kr: "푸크린",
    	zh: "胖可丁"
    },
    	"041": {
    	de: "Zubat",
    	en: "Zubat",
    	fr: "Nosferapti",
    	ja: "ズバット",
    	kr: "주뱃",
    	zh: "超音蝠"
    },
    	"042": {
    	de: "Golbat",
    	en: "Golbat",
    	fr: "Nosferalto",
    	ja: "ゴルバット",
    	kr: "골뱃",
    	zh: "大嘴蝠"
    },
    	"043": {
    	de: "Myrapla",
    	en: "Oddish",
    	fr: "Mystherbe",
    	ja: "ナゾノクサ",
    	kr: "뚜벅쵸",
    	zh: "走路草"
    },
    	"044": {
    	de: "Duflor",
    	en: "Gloom",
    	fr: "Ortide",
    	ja: "クサイハナ",
    	kr: "냄새꼬",
    	zh: "臭臭花"
    },
    	"045": {
    	de: "Giflor",
    	en: "Vileplume",
    	fr: "Rafflesia",
    	ja: "ラフレシア",
    	kr: "라플레시아",
    	zh: "霸王花"
    },
    	"046": {
    	de: "Paras",
    	en: "Paras",
    	fr: "Paras",
    	ja: "パラス",
    	kr: "파라스",
    	zh: "派拉斯"
    },
    	"047": {
    	de: "Parasek",
    	en: "Parasect",
    	fr: "Parasect",
    	ja: "パラセクト",
    	kr: "파라섹트",
    	zh: "派拉斯特"
    },
    	"048": {
    	de: "Bluzuk",
    	en: "Venonat",
    	fr: "Mimitoss",
    	ja: "コンパン",
    	kr: "콘팡",
    	zh: "毛球"
    },
    	"049": {
    	de: "Omot",
    	en: "Venomoth",
    	fr: "Aéromite",
    	ja: "モルフォン",
    	kr: "도나리",
    	zh: "摩魯蛾"
    },
    	"050": {
    	de: "Digda",
    	en: "Diglett",
    	fr: "Taupiqueur",
    	ja: "ディグダ",
    	kr: "디그다",
    	zh: "地鼠"
    },
    	"051": {
    	de: "Digdri",
    	en: "Dugtrio",
    	fr: "Triopikeur",
    	ja: "ダグトリオ",
    	kr: "닥트리오",
    	zh: "三地鼠"
    },
    	"052": {
    	de: "Mauzi",
    	en: "Meowth",
    	fr: "Miaouss",
    	ja: "ニャース",
    	kr: "나옹",
    	zh: "喵喵"
    },
    	"053": {
    	de: "Snobilikat",
    	en: "Persian",
    	fr: "Persian",
    	ja: "ペルシアン",
    	kr: "페르시온",
    	zh: "貓老大"
    },
    	"054": {
    	de: "Enton",
    	en: "Psyduck",
    	fr: "Psykokwak",
    	ja: "コダック",
    	kr: "고라파덕",
    	zh: "可達鴨"
    },
    	"055": {
    	de: "Entoron",
    	en: "Golduck",
    	fr: "Akwakwak",
    	ja: "ゴルダック",
    	kr: "골덕",
    	zh: "哥達鴨"
    },
    	"056": {
    	de: "Menki",
    	en: "Mankey",
    	fr: "Férosinge",
    	ja: "マンキー",
    	kr: "망키",
    	zh: "猴怪"
    },
    	"057": {
    	de: "Rasaff",
    	en: "Primeape",
    	fr: "Colossinge",
    	ja: "オコリザル",
    	kr: "성원숭",
    	zh: "火爆猴"
    },
    	"058": {
    	de: "Fukano",
    	en: "Growlithe",
    	fr: "Caninos",
    	ja: "ガーディ",
    	kr: "가디",
    	zh: "卡蒂狗"
    },
    	"059": {
    	de: "Arkani",
    	en: "Arcanine",
    	fr: "Arcanin",
    	ja: "ウインディ",
    	kr: "윈디",
    	zh: "風速狗"
    },
    	"060": {
    	de: "Quapsel",
    	en: "Poliwag",
    	fr: "Ptitard",
    	ja: "ニョロモ",
    	kr: "발챙이",
    	zh: "蚊香蝌蚪"
    },
    	"061": {
    	de: "Quaputzi",
    	en: "Poliwhirl",
    	fr: "Têtarte",
    	ja: "ニョロゾ",
    	kr: "슈륙챙이",
    	zh: "蚊香君"
    },
    	"062": {
    	de: "Quappo",
    	en: "Poliwrath",
    	fr: "Tartard",
    	ja: "ニョロボン",
    	kr: "강챙이",
    	zh: "蚊香泳士"
    },
    	"063": {
    	de: "Abra",
    	en: "Abra",
    	fr: "Abra",
    	ja: "ケーシィ",
    	kr: "캐이시",
    	zh: "凱西"
    },
    	"064": {
    	de: "Kadabra",
    	en: "Kadabra",
    	fr: "Kadabra",
    	ja: "ユンゲラー",
    	kr: "윤겔라",
    	zh: "勇基拉"
    },
    	"065": {
    	de: "Simsala",
    	en: "Alakazam",
    	fr: "Alakazam",
    	ja: "フーディン",
    	kr: "후딘",
    	zh: "胡地"
    },
    	"066": {
    	de: "Machollo",
    	en: "Machop",
    	fr: "Machoc",
    	ja: "ワンリキー",
    	kr: "알통몬",
    	zh: "腕力"
    },
    	"067": {
    	de: "Maschock",
    	en: "Machoke",
    	fr: "Machopeur",
    	ja: "ゴーリキー",
    	kr: "근육몬",
    	zh: "豪力"
    },
    	"068": {
    	de: "Machomei",
    	en: "Machamp",
    	fr: "Mackogneur",
    	ja: "カイリキー",
    	kr: "괴력몬",
    	zh: "怪力"
    },
    	"069": {
    	de: "Knofensa",
    	en: "Bellsprout",
    	fr: "Chétiflor",
    	ja: "マダツボミ",
    	kr: "모다피",
    	zh: "喇叭芽"
    },
    	"070": {
    	de: "Ultrigaria",
    	en: "Weepinbell",
    	fr: "Boustiflor",
    	ja: "ウツドン",
    	kr: "우츠동",
    	zh: "口呆花"
    },
    	"071": {
    	de: "Sarzenia",
    	en: "Victreebel",
    	fr: "Empiflor",
    	ja: "ウツボット",
    	kr: "우츠보트",
    	zh: "大食花"
    },
    	"072": {
    	de: "Tentacha",
    	en: "Tentacool",
    	fr: "Tentacool",
    	ja: "メノクラゲ",
    	kr: "왕눈해",
    	zh: "瑪瑙水母"
    },
    	"073": {
    	de: "Tentoxa",
    	en: "Tentacruel",
    	fr: "Tentacruel",
    	ja: "ドククラゲ",
    	kr: "독파리",
    	zh: "毒刺水母"
    },
    	"074": {
    	de: "Kleinstein",
    	en: "Geodude",
    	fr: "Racaillou",
    	ja: "イシツブテ",
    	kr: "꼬마돌",
    	zh: "小拳石"
    },
    	"075": {
    	de: "Georok",
    	en: "Graveler",
    	fr: "Gravalanch",
    	ja: "ゴローン",
    	kr: "데구리",
    	zh: "隆隆石"
    },
    	"076": {
    	de: "Geowaz",
    	en: "Golem",
    	fr: "Grolem",
    	ja: "ゴローニャ",
    	kr: "딱구리",
    	zh: "隆隆岩"
    },
    	"077": {
    	de: "Ponita",
    	en: "Ponyta",
    	fr: "Ponyta",
    	ja: "ポニータ",
    	kr: "포니타",
    	zh: "小火馬"
    },
    	"078": {
    	de: "Gallopa",
    	en: "Rapidash",
    	fr: "Galopa",
    	ja: "ギャロップ",
    	kr: "날쌩마",
    	zh: "烈焰馬"
    },
    	"079": {
    	de: "Flegmon",
    	en: "Slowpoke",
    	fr: "Ramoloss",
    	ja: "ヤドン",
    	kr: "야돈",
    	zh: "呆呆獸"
    },
    	"080": {
    	de: "Lahmus",
    	en: "Slowbro",
    	fr: "Flagadoss",
    	ja: "ヤドラン",
    	kr: "야도란",
    	zh: "呆殼獸"
    },
    	"081": {
    	de: "Magnetilo",
    	en: "Magnemite",
    	fr: "Magnéti",
    	ja: "コイル",
    	kr: "코일",
    	zh: "小磁怪"
    },
    	"082": {
    	de: "Magneton",
    	en: "Magneton",
    	fr: "Magnéton",
    	ja: "レアコイル",
    	kr: "레어코일",
    	zh: "三合一磁怪"
    },
    	"083": {
    	de: "Porenta",
    	en: "Farfetch’d",
    	fr: "Canarticho",
    	ja: "カモネギ",
    	kr: "파오리",
    	zh: "大蔥鴨"
    },
    	"084": {
    	de: "Dodu",
    	en: "Doduo",
    	fr: "Doduo",
    	ja: "ドードー",
    	kr: "두두",
    	zh: "嘟嘟"
    },
    	"085": {
    	de: "Dodri",
    	en: "Dodrio",
    	fr: "Dodrio",
    	ja: "ドードリオ",
    	kr: "두트리오",
    	zh: "嘟嘟利"
    },
    	"086": {
    	de: "Jurob",
    	en: "Seel",
    	fr: "Otaria",
    	ja: "パウワウ",
    	kr: "쥬쥬",
    	zh: "小海獅"
    },
    	"087": {
    	de: "Jugong",
    	en: "Dewgong",
    	fr: "Lamantine",
    	ja: "ジュゴン",
    	kr: "쥬레곤",
    	zh: "白海獅"
    },
    	"088": {
    	de: "Sleima",
    	en: "Grimer",
    	fr: "Tadmorv",
    	ja: "ベトベター",
    	kr: "질퍽이",
    	zh: "臭泥"
    },
    	"089": {
    	de: "Sleimok",
    	en: "Muk",
    	fr: "Grotadmorv",
    	ja: "ベトベトン",
    	kr: "질뻐기",
    	zh: "臭臭泥"
    },
    	"090": {
    	de: "Muschas",
    	en: "Shellder",
    	fr: "Kokiyas",
    	ja: "シェルダー",
    	kr: "셀러",
    	zh: "大舌貝"
    },
    	"091": {
    	de: "Austos",
    	en: "Cloyster",
    	fr: "Crustabri",
    	ja: "パルシェン",
    	kr: "파르셀",
    	zh: "刺甲貝"
    },
    	"092": {
    	de: "Nebulak",
    	en: "Gastly",
    	fr: "Fantominus",
    	ja: "ゴース",
    	kr: "고오스",
    	zh: "鬼斯"
    },
    	"093": {
    	de: "Alpollo",
    	en: "Haunter",
    	fr: "Spectrum",
    	ja: "ゴースト",
    	kr: "고우스트",
    	zh: "鬼斯通"
    },
    	"094": {
    	de: "Gengar",
    	en: "Gengar",
    	fr: "Ectoplasma",
    	ja: "ゲンガー",
    	kr: "팬텀",
    	zh: "耿鬼"
    },
    	"095": {
    	de: "Onix",
    	en: "Onix",
    	fr: "Onix",
    	ja: "イワーク",
    	kr: "롱스톤",
    	zh: "大岩蛇"
    },
    	"096": {
    	de: "Traumato",
    	en: "Drowzee",
    	fr: "Soporifik",
    	ja: "スリープ",
    	kr: "슬리프",
    	zh: "催眠貘"
    },
    	"097": {
    	de: "Hypno",
    	en: "Hypno",
    	fr: "Hypnomade",
    	ja: "スリーパー",
    	kr: "슬리퍼",
    	zh: "引夢貘人"
    },
    	"098": {
    	de: "Krabby",
    	en: "Krabby",
    	fr: "Krabby",
    	ja: "クラブ",
    	kr: "크랩",
    	zh: "大鉗蟹"
    },
    	"099": {
    	de: "Kingler",
    	en: "Kingler",
    	fr: "Krabboss",
    	ja: "キングラー",
    	kr: "킹크랩",
    	zh: "巨鉗蟹"
    }
    };

    var langs = [
    	[
    		"en",
    		"cp",
    		"hp",
    		"English"
    	],
    	[
    		"ja",
    		"cp",
    		"hp",
    		"Japanese"
    	],
    	[
    		"fr",
    		"pc",
    		"pv",
    		"French"
    	],
    	[
    		"es",
    		"pc",
    		"ps",
    		"Spanish"
    	],
    	[
    		"de",
    		"wp",
    		"kp",
    		"German"
    	],
    	[
    		"il",
    		"pl",
    		"ps",
    		"Italian"
    	],
    	[
    		"ko",
    		"cp",
    		"hp",
    		"Korean"
    	],
    	[
    		"zh",
    		"cp",
    		"hp",
    		"Chinese"
    	],
    	[
    		"pt",
    		"pc",
    		"ps",
    		"Portuguese"
    	]
    ];

    var cpm = [
    	0.094,
    	0.16639787,
    	0.21573247,
    	0.25572005,
    	0.29024988,
    	0.3210876,
    	0.34921268,
    	0.3752356,
    	0.39956728,
    	0.4225,
    	0.44310755,
    	0.4627984,
    	0.48168495,
    	0.49985844,
    	0.51739395,
    	0.5343543,
    	0.5507927,
    	0.5667545,
    	0.5822789,
    	0.5974,
    	0.6121573,
    	0.6265671,
    	0.64065295,
    	0.65443563,
    	0.667934,
    	0.6811649,
    	0.69414365,
    	0.7068842,
    	0.7193991,
    	0.7317,
    	0.7377695,
    	0.74378943,
    	0.74976104,
    	0.7556855,
    	0.76156384,
    	0.76739717,
    	0.7731865,
    	0.77893275,
    	0.784637,
    	0.7903
    ];

    function getMatchingString(a, t) {
      let list = '';
      let last = -1;
      for ( let i = 0; i < a.length; i++ ) {
        if ( a[i] === last + 1 ) {
          list += '-';
          last = a[i];
          while ( ++i < a.length ) {
            if ( a[i] !== last + 1 ) { break; }
            last = a[i];
          }
          if ( a[--i] < 9999 ) {
            list += a[i];
          }
        } else {
          list += ',' + t + a[i];
          last = a[i];
        }
      }

      return list.substr(1);
    }
    function searchString(data) {
      let pm = data.pm;
      if (!pm) { return 'GG'; }

      let cps = new Set();
      let hps = new Set();
      const [cpstr, hpstr] = data.cphp;
      const [baseA, baseD, baseS] = [...pm.ads];

      for ( let atk = data.min_iv_a; atk <= 15; atk++ ) {
        for ( let def = data.min_iv_d; def <= 15; def++ ) {
          for ( let sta = data.min_iv_s; sta <= 15; sta++ ) {
            if ( atk + def + sta < data.min_iv ) { continue; }

            for ( let level = data.min_lv; level <= data.max_lv; level++ ) {
              let cp = Math.floor(
                (baseA + atk)
                * Math.sqrt(baseD + def)
                * Math.sqrt(baseS + sta)
                * (cpm[level] * cpm[level] / 10)
              );
              if (cp < 10) { cp = 10; }
              cps.add(cp);

              let hp = Math.floor((baseS + sta) * cpm[level]);
              if (hp < 10) { hp = 10; }
              hps.add(hp);
            }
          }
        }
      }

      if (data.trash) {
        let max = 0;
        for ( let i = 10; i <= 9999; i++ ) {
          if ( cps.has(i) ) {
            max = i;
          }
        }
        for ( let i = 10; i <= max; i++ ) {
          if ( cps.has(i) ) {
            cps.delete(i);
          } else {
            cps.add(i);
          }
        }
      }

      cps = Array.from(cps);
      cps.sort((a, b) => a - b);

      let output = pm.dex + '&' + getMatchingString(cps, cpstr);

      if (!data.trash) {
        hps = Array.from(hps);
        hps.sort((a, b) => a - b);
        output += '&' + getMatchingString(hps, hpstr);
      }

      return output;
    }
    function genOptions(v, l = v) {
      return `<option value="${v}" label="${l}"></option>`;
    }
    const options = {
      ivp: [...Array(46).keys()]
        .map(i => [i, +(i * 100 / 45).toFixed()]).reverse(),

      iv: [...Array(16).keys()].reverse(),

      lv: [...Array(40).keys()]
        .map(i => [i, i + 1]).reverse(),
    };

    var u = /*#__PURE__*/Object.freeze({
        getMatchingString: getMatchingString,
        searchString: searchString,
        genOptions: genOptions,
        options: options
    });

    /* src/App.svelte generated by Svelte v3.5.4 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.i = list[i];
    	return child_ctx;
    }

    // (161:8) {#each u.options.ivp as i}
    function create_each_block_6(ctx) {
    	var option, t_value = ctx.i[1], t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i[0];
    			option.value = option.__value;
    			add_location(option, file, 161, 10, 3235);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (171:6) {#each u.options.iv as i}
    function create_each_block_5(ctx) {
    	var option, t_value = ctx.i, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i;
    			option.value = option.__value;
    			add_location(option, file, 171, 8, 3452);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (177:6) {#each u.options.iv as i}
    function create_each_block_4(ctx) {
    	var option, t_value = ctx.i, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i;
    			option.value = option.__value;
    			add_location(option, file, 177, 8, 3594);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (183:6) {#each u.options.iv as i}
    function create_each_block_3(ctx) {
    	var option, t_value = ctx.i, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i;
    			option.value = option.__value;
    			add_location(option, file, 183, 8, 3736);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (192:6) {#each u.options.lv as i}
    function create_each_block_2(ctx) {
    	var option, t_value = ctx.i[1], t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i[0];
    			option.value = option.__value;
    			add_location(option, file, 192, 8, 3918);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (198:6) {#each u.options.lv as i}
    function create_each_block_1(ctx) {
    	var option, t_value = ctx.i[1], t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i[0];
    			option.value = option.__value;
    			add_location(option, file, 198, 8, 4069);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (208:8) {#each langs as i}
    function create_each_block(ctx) {
    	var option, t_value = ctx.i[3], t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.i[0];
    			option.value = option.__value;
    			add_location(option, file, 208, 10, 4271);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div8, h1, t1, div1, t2, div0, t3, input0, t4, span, t5_value = ctx.data.pmName, t5, t6, datalist_1, t7, div2, label0, t8, select0, t9, div3, t10, select1, t11, select2, t12, select3, t13, div4, t14, select4, t15, select5, t16, div5, label1, t17, select6, t18, div6, label2, t19, input1, t20, hr0, t21, div7, button, t23, textarea, t24, hr1, t25, footer, t26, a, dispose;

    	var each_value_6 = options.ivp;

    	var each_blocks_6 = [];

    	for (var i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_6[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	var each_value_5 = options.iv;

    	var each_blocks_5 = [];

    	for (var i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	var each_value_4 = options.iv;

    	var each_blocks_4 = [];

    	for (var i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_4[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	var each_value_3 = options.iv;

    	var each_blocks_3 = [];

    	for (var i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	var each_value_2 = options.lv;

    	var each_blocks_2 = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	var each_value_1 = options.lv;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = langs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div8 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Pokémon Go Search String Generateor";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Pokémon:\n    ");
    			div0 = element("div");
    			t3 = text("#");
    			input0 = element("input");
    			t4 = space();
    			span = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			datalist_1 = element("datalist");
    			t7 = space();
    			div2 = element("div");
    			label0 = element("label");
    			t8 = text("Minimum %:\n      ");
    			select0 = element("select");

    			for (var i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t9 = space();
    			div3 = element("div");
    			t10 = text("Min IVs (A/D/S):\n    ");
    			select1 = element("select");

    			for (var i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t11 = space();
    			select2 = element("select");

    			for (var i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t12 = space();
    			select3 = element("select");

    			for (var i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t13 = space();
    			div4 = element("div");
    			t14 = text("Level:\n    ");
    			select4 = element("select");

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t15 = text("\n    -\n    ");
    			select5 = element("select");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t16 = space();
    			div5 = element("div");
    			label1 = element("label");
    			t17 = text("Language:\n      ");
    			select6 = element("select");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			div6 = element("div");
    			label2 = element("label");
    			t19 = text("Trash String:\n      ");
    			input1 = element("input");
    			t20 = space();
    			hr0 = element("hr");
    			t21 = space();
    			div7 = element("div");
    			button = element("button");
    			button.textContent = "Click to Copy!";
    			t23 = space();
    			textarea = element("textarea");
    			t24 = space();
    			hr1 = element("hr");
    			t25 = space();
    			footer = element("footer");
    			t26 = text("this tool fork from ");
    			a = element("a");
    			a.textContent = "http://ark42.com/pogo/search.php";
    			add_location(h1, file, 136, 2, 2724);
    			attr(input0, "type", "text");
    			attr(input0, "name", "pmuid");
    			input0.required = true;
    			attr(input0, "list", "pokemon");
    			attr(input0, "class", "svelte-16ktrhs");
    			add_location(input0, file, 141, 7, 2833);
    			attr(span, "class", "ib svelte-16ktrhs");
    			add_location(span, file, 148, 6, 2967);
    			attr(div0, "class", "ib svelte-16ktrhs");
    			add_location(div0, file, 140, 4, 2809);
    			attr(datalist_1, "id", "pokemon");
    			add_location(datalist_1, file, 151, 4, 3023);
    			attr(div1, "class", "label");
    			add_location(div1, file, 138, 2, 2772);
    			if (ctx.data.min_iv === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
    			add_location(select0, file, 159, 6, 3154);
    			add_location(label0, file, 157, 4, 3123);
    			attr(div2, "class", "label");
    			add_location(div2, file, 156, 2, 3099);
    			if (ctx.data.min_iv_a === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
    			add_location(select1, file, 169, 4, 3374);
    			if (ctx.data.min_iv_d === void 0) add_render_callback(() => ctx.select2_change_handler.call(select2));
    			add_location(select2, file, 175, 4, 3516);
    			if (ctx.data.min_iv_s === void 0) add_render_callback(() => ctx.select3_change_handler.call(select3));
    			add_location(select3, file, 181, 4, 3658);
    			attr(div3, "class", "label");
    			add_location(div3, file, 167, 2, 3329);
    			if (ctx.data.min_lv === void 0) add_render_callback(() => ctx.select4_change_handler.call(select4));
    			add_location(select4, file, 190, 4, 3842);
    			if (ctx.data.max_lv === void 0) add_render_callback(() => ctx.select5_change_handler.call(select5));
    			add_location(select5, file, 196, 4, 3993);
    			attr(div4, "class", "label");
    			add_location(div4, file, 188, 2, 3807);
    			if (ctx.data.lang === void 0) add_render_callback(() => ctx.select6_change_handler.call(select6));
    			add_location(select6, file, 206, 6, 4200);
    			add_location(label1, file, 204, 4, 4170);
    			attr(div5, "class", "label");
    			add_location(div5, file, 203, 2, 4146);
    			attr(input1, "type", "checkbox");
    			attr(input1, "class", "svelte-16ktrhs");
    			add_location(input1, file, 217, 6, 4423);
    			add_location(label2, file, 215, 4, 4389);
    			attr(div6, "class", "label");
    			add_location(div6, file, 214, 2, 4365);
    			add_location(hr0, file, 221, 2, 4500);
    			attr(button, "class", "copy svelte-16ktrhs");
    			add_location(button, file, 224, 4, 4538);
    			attr(div7, "class", "text-center svelte-16ktrhs");
    			add_location(div7, file, 223, 2, 4508);
    			attr(textarea, "class", "svelte-16ktrhs");
    			add_location(textarea, file, 227, 2, 4628);
    			add_location(hr1, file, 229, 2, 4712);
    			attr(a, "href", "http://ark42.com/pogo/search.php");
    			add_location(a, file, 232, 24, 4753);
    			attr(footer, "class", "svelte-16ktrhs");
    			add_location(footer, file, 231, 2, 4720);
    			attr(div8, "class", "workspace");
    			add_location(div8, file, 135, 0, 2698);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(select0, "change", ctx.select0_change_handler),
    				listen(select1, "change", ctx.select1_change_handler),
    				listen(select2, "change", ctx.select2_change_handler),
    				listen(select3, "change", ctx.select3_change_handler),
    				listen(select4, "change", ctx.select4_change_handler),
    				listen(select5, "change", ctx.select5_change_handler),
    				listen(select6, "change", ctx.select6_change_handler),
    				listen(input1, "change", ctx.input1_change_handler),
    				listen(button, "click", prevent_default(ctx.copy)),
    				listen(textarea, "input", ctx.textarea_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div8, anchor);
    			append(div8, h1);
    			append(div8, t1);
    			append(div8, div1);
    			append(div1, t2);
    			append(div1, div0);
    			append(div0, t3);
    			append(div0, input0);

    			input0.value = ctx.data.uid;

    			append(div0, t4);
    			append(div0, span);
    			append(span, t5);
    			append(div1, t6);
    			append(div1, datalist_1);
    			datalist_1.innerHTML = ctx.datalist;
    			append(div8, t7);
    			append(div8, div2);
    			append(div2, label0);
    			append(label0, t8);
    			append(label0, select0);

    			for (var i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].m(select0, null);
    			}

    			select_option(select0, ctx.data.min_iv);

    			append(div8, t9);
    			append(div8, div3);
    			append(div3, t10);
    			append(div3, select1);

    			for (var i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(select1, null);
    			}

    			select_option(select1, ctx.data.min_iv_a);

    			append(div3, t11);
    			append(div3, select2);

    			for (var i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(select2, null);
    			}

    			select_option(select2, ctx.data.min_iv_d);

    			append(div3, t12);
    			append(div3, select3);

    			for (var i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(select3, null);
    			}

    			select_option(select3, ctx.data.min_iv_s);

    			append(div8, t13);
    			append(div8, div4);
    			append(div4, t14);
    			append(div4, select4);

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select4, null);
    			}

    			select_option(select4, ctx.data.min_lv);

    			append(div4, t15);
    			append(div4, select5);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select5, null);
    			}

    			select_option(select5, ctx.data.max_lv);

    			append(div8, t16);
    			append(div8, div5);
    			append(div5, label1);
    			append(label1, t17);
    			append(label1, select6);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select6, null);
    			}

    			select_option(select6, ctx.data.lang);

    			append(div8, t18);
    			append(div8, div6);
    			append(div6, label2);
    			append(label2, t19);
    			append(label2, input1);

    			input1.checked = ctx.data.trash;

    			append(div8, t20);
    			append(div8, hr0);
    			append(div8, t21);
    			append(div8, div7);
    			append(div7, button);
    			append(div8, t23);
    			append(div8, textarea);

    			textarea.value = ctx.data.searchString;

    			add_binding_callback(() => ctx.textarea_binding(textarea, null));
    			append(div8, t24);
    			append(div8, hr1);
    			append(div8, t25);
    			append(div8, footer);
    			append(footer, t26);
    			append(footer, a);
    		},

    		p: function update(changed, ctx) {
    			if (changed.data && (input0.value !== ctx.data.uid)) input0.value = ctx.data.uid;

    			if ((changed.data) && t5_value !== (t5_value = ctx.data.pmName)) {
    				set_data(t5, t5_value);
    			}

    			if (changed.datalist) {
    				datalist_1.innerHTML = ctx.datalist;
    			}

    			if (changed.u) {
    				each_value_6 = options.ivp;

    				for (var i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_6[i]) {
    						each_blocks_6[i].p(changed, child_ctx);
    					} else {
    						each_blocks_6[i] = create_each_block_6(child_ctx);
    						each_blocks_6[i].c();
    						each_blocks_6[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_6.length; i += 1) {
    					each_blocks_6[i].d(1);
    				}
    				each_blocks_6.length = each_value_6.length;
    			}

    			if (changed.data) select_option(select0, ctx.data.min_iv);

    			if (changed.u) {
    				each_value_5 = options.iv;

    				for (var i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(changed, child_ctx);
    					} else {
    						each_blocks_5[i] = create_each_block_5(child_ctx);
    						each_blocks_5[i].c();
    						each_blocks_5[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_5.length; i += 1) {
    					each_blocks_5[i].d(1);
    				}
    				each_blocks_5.length = each_value_5.length;
    			}

    			if (changed.data) select_option(select1, ctx.data.min_iv_a);

    			if (changed.u) {
    				each_value_4 = options.iv;

    				for (var i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(changed, child_ctx);
    					} else {
    						each_blocks_4[i] = create_each_block_4(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}
    				each_blocks_4.length = each_value_4.length;
    			}

    			if (changed.data) select_option(select2, ctx.data.min_iv_d);

    			if (changed.u) {
    				each_value_3 = options.iv;

    				for (var i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(changed, child_ctx);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select3, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}
    				each_blocks_3.length = each_value_3.length;
    			}

    			if (changed.data) select_option(select3, ctx.data.min_iv_s);

    			if (changed.u) {
    				each_value_2 = options.lv;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select4, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}
    				each_blocks_2.length = each_value_2.length;
    			}

    			if (changed.data) select_option(select4, ctx.data.min_lv);

    			if (changed.u) {
    				each_value_1 = options.lv;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select5, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.data) select_option(select5, ctx.data.max_lv);

    			if (changed.langs) {
    				each_value = langs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.data) select_option(select6, ctx.data.lang);
    			if (changed.data) input1.checked = ctx.data.trash;
    			if (changed.data) textarea.value = ctx.data.searchString;
    			if (changed.items) {
    				ctx.textarea_binding(null, textarea);
    				ctx.textarea_binding(textarea, null);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div8);
    			}

    			destroy_each(each_blocks_6, detaching);

    			destroy_each(each_blocks_5, detaching);

    			destroy_each(each_blocks_4, detaching);

    			destroy_each(each_blocks_3, detaching);

    			destroy_each(each_blocks_2, detaching);

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			ctx.textarea_binding(null, textarea);
    			run_all(dispose);
    		}
    	};
    }

    function urlGoGoGo(d) {
      return new URLSearchParams(d).toString();
    }

    function getPM(uid) {
      return pms.find(_pm => _pm.uid === uid);
    }

    function instance($$self, $$props, $$invalidate) {
    	

      pms.forEach(pm => {
        pm.uid = pm.dex + (pm.isotope ? `-${pm.isotope}` : '');
        pm.ddex = `00${pm.dex}`.slice(-3);
        pm.name = getPmName(pm.ddex, 'en');
      });

      const urlParamsWL = ['uid', 'min_iv', 'min_iv_a', 'min_iv_d', 'min_iv_s', 'min_lv', 'max_lv', 'lang', 'trash'];
      const numberTypes = ['min_iv', 'min_iv_a', 'min_iv_d', 'min_iv_s', 'min_lv', 'max_lv'];

      let data;

      {
        let defaultData = {
          uid: '1',
          min_iv: 44,
          min_iv_a: 14,
          min_iv_d: 13,
          min_iv_s: 13,
          min_lv: 0,
          max_lv: 34,
          lang: 'en',
          trash: true,
          cphp: null,
        };

        let urlp = new URLSearchParams(location.hash.replace(/^#/, ''));
        let urlData = urlParamsWL.reduce((all, p) => {
          if (urlp.has(p)) {
            let v = urlp.get(p);
            if (v === 'true' || v === 'false') {
              v = !(v === 'false');
            }
            if (numberTypes.indexOf(p) !== -1) {
              v = +v;
            }
            all[p] = v;
          }
          return all;
        }, {});

        $$invalidate('data', data = {
          ...defaultData,
          ...urlData,
        });
      }

      window.dd = data;

      let datalist;

      let textareaElm;
      function copy() {
        textareaElm.select();
        document.execCommand('copy');
      }
      function getPmName(ddex, lang = data.lang) {
        return names[ddex][lang] || names[ddex].en;
      }

      function getTitle(uid) {
        let pm = getPM(uid);
        if (!pm) { return ''; }

        let n = getPmName(pm.ddex);
        if (pm.isotope) {
          n = `${n} (${pm.isotope})`;
        }
        return n;
      }
    	function input0_input_handler() {
    		data.uid = this.value;
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select0_change_handler() {
    		data.min_iv = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select1_change_handler() {
    		data.min_iv_a = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select2_change_handler() {
    		data.min_iv_d = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select3_change_handler() {
    		data.min_iv_s = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select4_change_handler() {
    		data.min_lv = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select5_change_handler() {
    		data.max_lv = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function select6_change_handler() {
    		data.lang = select_value(this);
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function input1_change_handler() {
    		data.trash = this.checked;
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function textarea_input_handler() {
    		data.searchString = this.value;
    		$$invalidate('data', data);
    		$$invalidate('u', u);
    	}

    	function textarea_binding($$node, check) {
    		textareaElm = $$node;
    		$$invalidate('textareaElm', textareaElm);
    	}

    	$$self.$$.update = ($$dirty = { data: 1 }) => {
    		if ($$dirty.data) { data.pm = getPM(data.uid); $$invalidate('data', data); }
    		if ($$dirty.data) { data.pmName = getTitle(data.uid); $$invalidate('data', data); }
    		if ($$dirty.data) { data.cphp = langs.find(l => l[0] === data.lang).slice(1, 3); $$invalidate('data', data); }
    		if ($$dirty.data) { data.searchString = searchString(data); $$invalidate('data', data); }
    		if ($$dirty.data) { location.hash = urlGoGoGo({
            uid: data.uid,
            min_iv: data.min_iv,
            min_iv_a: data.min_iv_a,
            min_iv_d: data.min_iv_d,
            min_iv_s: data.min_iv_s,
            min_lv: data.min_lv,
            max_lv: data.max_lv,
            lang: data.lang,
            trash: data.trash,
          }); }
    		if ($$dirty.data) { $$invalidate('datalist', datalist = pms.map(pm => {
            return genOptions(pm.uid, getTitle(pm.uid, data.lang));
          }).join('')); }
    	};

    	return {
    		data,
    		datalist,
    		textareaElm,
    		copy,
    		input0_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler,
    		select3_change_handler,
    		select4_change_handler,
    		select5_change_handler,
    		select6_change_handler,
    		input1_change_handler,
    		textarea_input_handler,
    		textarea_binding
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
