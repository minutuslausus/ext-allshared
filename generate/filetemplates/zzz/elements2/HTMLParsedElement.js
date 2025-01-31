const HTMLParsedElement = (() => {
    const DCL = 'DOMContentLoaded';
    const init = new window.WeakMap;
    const queue = [];
    const isParsed = el => {
        do {
            if (el.nextSibling)
                return true;
        } while (el = el.parentNode);
        return false;
    };
    const upgrade = () => {
        queue.splice(0).forEach(info => {
            if (init.get(info[0]) !== true) {
                init.set(info[0], true);
                info[0][info[1]]();
            }
        });
    };
    document.addEventListener(DCL, upgrade);
    class HTMLParsedElement extends HTMLElement {
        static withParsedCallback(Class, name = 'parsed') {
            const {prototype} = Class;
            const {connectedCallback} = prototype;
            const method = name + 'Callback';
            const cleanUp = (el, observer, ownerDocument, onDCL) => {
                observer.disconnect();
                ownerDocument.removeEventListener(DCL, onDCL);
                parsedCallback(el);
            };
            const parsedCallback = el => {
                if (!queue.length)
                    requestAnimationFrame(upgrade);
                queue.push([el, method]);
            };
            Object.defineProperties(
                prototype,
                {
                    connectedCallback: {
                        configurable: true,
                        value() {
                            if (connectedCallback)
                                connectedCallback.apply(this, arguments);
                            if (method in this && !init.has(this)) {
                                const self = this;
                                const {ownerDocument} = self;
                                init.set(self, false);
                                if (ownerDocument.readyState === 'complete' || isParsed(self))
                                {
                                    //console.log(window.Ext);
                                    if (window.Ext == undefined) {
                                        var striptTag = document.createElement('script');
                                        striptTag.type = 'text/javascript';
                                        striptTag.src = './node_modules/@sencha/ext-runtime-base/engine.js';
                                        striptTag.onload = function() {
                                            var linkTag = document.createElement('link');
                                            linkTag.rel = 'stylesheet';
                                            linkTag.type = 'text/css';
                                            linkTag.href = './node_modules/@sencha/ext-runtime-base/theme/material/material-all.css';
                                            linkTag.onload = function() {
                                                console.log('load done');
                                                Ext.onReady(function() {
                                                    parsedCallback(self);
                                                });
                                            };
                                            document.getElementsByTagName('head')[0].appendChild(linkTag);
                                        };
                                        document.getElementsByTagName('head')[0].appendChild(striptTag);
                                    }
                                    else {
                                        parsedCallback(self);
                                    }
                                }
                                else {
                                    const onDCL = () => cleanUp(self, observer, ownerDocument, onDCL);
                                    ownerDocument.addEventListener(DCL, onDCL);
                                    const observer = new MutationObserver(() => {
                                        /* istanbul ignore else */
                                        if (isParsed(self))
                                            cleanUp(self, observer, ownerDocument, onDCL);
                                    });
                                    observer.observe(self.parentNode, {childList: true, subtree: true});
                                }
                            }
                        }
                    },
                    [name]: {
                        configurable: true,
                        get() {
                            return init.get(this) === true;
                        }
                    }
                }
            );
            return Class;
        }
    }
    return HTMLParsedElement.withParsedCallback(HTMLParsedElement);
})();
export default HTMLParsedElement;
