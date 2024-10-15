
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const clonedObj = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }

    return clonedObj;
}
function mergOption(o1, o2) {
    for (const o2Key in o2) {
        o1[o2Key] = o2[o2Key];
    }
    return o1;
}


/**
 * dom 构建函数。
 * <br>
 * 例如：
 * <br>
 * <pre>
 * var divDom = h("div", {
 *     on: {click: onClick},
 *     style: {color: "red", "background-color": "blue"},
 *     id: "dom_1",
 * });
 * document.body.append(divDom);
 * </pre>
 *
 *
 * @param tag {string} 希望构建的dom的节点
 * @param attr {object?} 节点上的属性配置
 * @param children {any?} 在该节点内的子节点，也可以是本函数返回值。
 * @returns {HTMLElement}
 */
function h(tag, attr, children) {
    let ele;
    // 处理子组件。
    let Component = this.components[tag];
    let componentInstace;
    if (Component) {
        let props = attr.props || {};
        if (typeof props === "function") {
            props = props.bind(this);
        }
        componentInstace = new Component({propData: props, parent: this});
        this.$children = this.$children || [];
        this.$children.push(componentInstace);
        ele = componentInstace.$mount();
    } else {
        // 处理html组件。
        ele = document.createElement(tag);
    }
    if (attr) {
        if (attr.style) {
            for (const key in attr.style) {
                if (key.startsWith("--")) {
                    ele.style.setProperty(key, attr.style[key]);
                } else {
                    ele.style[key] = attr.style[key];
                }
            }
            delete attr.style;
        }

        if (attr.on) {
            let _this = this;
            for (const eventName in attr.on){
                let listener = attr.on[eventName];
                ele.addEventListener(eventName, function (event) {
                    if (Object.prototype.toString.call(event) === "[object CustomEvent]") {
                        listener.call(_this, event.detail);
                    } else {
                        listener.call(_this);
                    }
                });
            }
            delete attr.on;
        }

        if (attr.class) {
            attr.className = attr.class;
            delete attr.class;
        }

        if (attr.ref) {
            this.$refs = this.$refs || {};

            if (this.$refs[attr.ref]) {
                if (!Array.isArray(this.$refs[attr.ref])) {
                    this.$refs[attr.ref] = [this.$refs[attr.ref]]
                }
                this.$refs[attr.ref].push(componentInstace || ele);
            } else {
                this.$refs[attr.ref] = componentInstace || ele;
            }
        }

        for (const key in attr) {

            // 处理组件类型时的参数。
            if (componentInstace && componentInstace.$props.hasOwnProperty(key)) {
                continue;
            }

            ele[key] = attr[key];
        }
    }
    let type = Object.prototype.toString.call(children);
    if (type !== '[object Array]' && type !== '[object Undefined]') {
        children = [children];
    }

    if (children) {
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let ct = typeof child;
            if (ct === "function") {
                child = child();
                ct = typeof child;
            }

            if (ct === "number" || ct === "string") {
                child = document.createTextNode(String(child));
            }

            ele.appendChild(child);
        }
    }

    return ele;
}

function Dep () {
    this.watchs = [];
}
Dep.target = null;
Dep.prototype.depect = function () {
    if (Dep.target && this.watchs.indexOf(Dep.target) === -1) {
        this.watchs.push(Dep.target);
        Dep.target = null;
    }
}
Dep.prototype.notify = function (callThisArg, nv, ov) {
    let arr = this.watchs;
    if (arr && arr.length > 0) {
        for (let i = 0; i < arr.length; i++) {
            arr[i].call(callThisArg, nv, ov);
        }
    }
}

/**
 * 将指定对象设置为支持响应式。
 * @param obj {object}
 * @private
 */
function _setreactive(obj) {
    let _this = this;
    Object.keys(obj).forEach(k => {
        let dep = new Dep();
        let value = obj[k];
        Object.defineProperty(obj, k, {
            get() {
                dep.depect();
                return value;
            },
            set(v) {
                let oldV = value;
                if (oldV === v) {
                    return;
                }
                value = v;
                dep.notify(_this, v, oldV);
            }
        });
    });
}
function _watch (expOrFun, callback) {
    Dep.target = callback;
    if (typeof expOrFun === "string") {
        (function () {
            return this[expOrFun];
        }).call(this);
    } else {
        expOrFun.call(this);
    }
    Dep.target = null;
}

/**
 * 代理指定对象。
 * @param objField {string}
 * @param readOnly {boolean}
 * @private
 */
function _proxy(objField, readOnly) {
    let _this = this;
    Object.keys(this[objField]).forEach(k => {
        Object.defineProperty(_this, k, {
            get() {
                return _this[objField][k];
            },
            set(v) {
                if (readOnly) {return}
                _this[objField][k] = v;
            }
        })
    });
}


/**
 * 组件构造函数。
 * @param option {{
 *     propData: object?,
 *     components: object?,
 *     render: function(function(string, object?, any[]?)),
 *     created: function?,
 *     mounted: function?,
 *     methods: object?,
 *     watch: object?,
 *     data: object?
 * }}
 * @constructor
 */
function Baby(option) {

    // this.__className = "BabyComponent";

    this._init(option);
}

Baby.prototype._init = function (option) {
    let _this = this;

    option = mergOption(option, this.$options || {});

    this.name = option.name;
    this.$el = undefined;

    this.$parent = option.parent;

    // 接入所有声明的参数。
    this.$props = {};
    let applyProp = (props) => {
        Object.keys(props).forEach(key => {
            this.$props[key] = props[key];
        });
    };
    if (typeof option.propData === "function") {
        let fn = () => {
            let props = option.propData.call();
            applyProp(props);
        }
        _watch.call(this, fn, fn);
    } else {
        applyProp(option.propData||{});
    }
    _setreactive.call(this, this.$props);
    _proxy.call(this, "$props", true);

    // 接入所有声明的变量。
    this.$data = deepClone(option.data || {});
    _setreactive.call(this, this.$data);
    _proxy.call(this, "$data", false);

    // 接入所有watch
    let watch = option.watch || {};
    this._watchFun = {};
    for (const watchKey in watch) {
        this._watchFun[watchKey] = watch[watchKey];
        _watch.call(this, watchKey, function (nv, ov) {
            this._watchFun[watchKey].call(this,nv, ov);
        });
    }


    // 接入所有声明的函数。
    let methods = option.methods || {};
    for (let m in methods) {
        Object.defineProperty(this, m, {
            value: methods[m].bind(this),
            writable: false
        });
    }

    // 接入所有要使用的子组件
    let components = option.components || {};
    this.components = {};
    this.$children = [];
    for (let c in components) {
        let cp = components[c];
        if (typeof cp === "function") {
            this.components[c] = Baby.extend(cp());
        } else {
            this.components[c] = Baby.extend(cp);
        }
    }

    // 接入渲染函数
    this.__r/*render*/ = (option.render || function () {
        throw new Error("必须提供 render 函数来渲染本组件。");
    }).bind(this);

    // 接入 mounted 函数
    if ("function" === typeof option.mounted) {
        this.__mounted = option.mounted.bind(this);
    }

    // 执行 created 回调。
    if ("function" === typeof option.created) {
        option.created.bind(this).call();
    }
}

/**
 * 此函数让你再业务逻辑执行过程中可以创建一个dom。
 * @param tag {string} 希望构建的dom的节点
 * @param attr {object?} 节点上的属性配置
 * @param children {any?} 在该节点内的子节点，也可以是本函数返回值。
 * @returns {HTMLElement}
 */
Baby.prototype.$createElement = function(cb) {
    return cb.call(this, h.bind(this));
}

/**
 * 挂载函数，执行此函数后，本组将将会替换 el 指定的位置。
 * @param el {string|HTMLElement?} 可以是 css 选择器，也可以是一个 HTMLElement 实例。
 */
Baby.prototype.$mount = function (el) {
    if ("string" === typeof el) {
        el = document.querySelector(el);
    }

    if ("undefined" !== typeof el) {

        if (!el.tagName || {html: true, body: true}[el.tagName.toLowerCase()]) {
            throw new Error("该挂载节点错误，请指定一个存在的非html、body节点。");
        }
    }

    // 渲染
    let dom = this.__r(h.bind(this));

    // 传入了目标替换实列。
    if (el) {
        el.replaceWith(dom);
    }

    this.$el = el = dom;

    // 执行 mounted 回调。
    if ("function" === typeof this.__mounted) {
        this.__mounted();
    }

    return el;
};

/**
 * 发出事件。
 * @param eventName {string} 事件名
 * @param arg {any} 事件参数
 */
Baby.prototype.$emit = function (eventName, arg) {
    let _this = this;
    let event = new CustomEvent(eventName, {
        detail: arg
    });
    setTimeout(function () {
        _this.$el.dispatchEvent(event);
    });
}


/**
 * 本函数用于创建组件构造函数。
 * @param componentOption {{
 *     name: string?,
 *     props: object?,
 *     components: object?,
 *     render: function(function(string, object?, any[]?)),
 *     created: function?,
 *     mounted: function?,
 *     methods: object?,
 *     watch: object?,
 *     data: object?
 * }}
 */
Baby.extend = function (componentOption) {

    const BabyComponent = function BabyComponent(option) {
        this._init(option);
    }

    BabyComponent.prototype = Object.create(this.prototype);
    BabyComponent.prototype.constructor = BabyComponent;
    BabyComponent.prototype.$options = deepClone(componentOption);

    return BabyComponent;
}

if (typeof window !== "undefined") {
    window.Baby = Baby;
}
module.exports = Baby;
