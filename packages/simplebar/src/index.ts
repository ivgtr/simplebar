import canUseDOM from 'can-use-dom';
import SimpleBarCore from 'simplebar-core';

const { getOptions } = SimpleBarCore;

export default class SimpleBar extends SimpleBarCore {
  static globalObserver: MutationObserver;

  static initDOMLoadedElements() {
    document.removeEventListener(
      'DOMContentLoaded',
      this.initDOMLoadedElements
    );
    window.removeEventListener('load', this.initDOMLoadedElements);

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-simplebar]'),
      (el) => {
        if (
          el.getAttribute('data-simplebar') !== 'init' &&
          !SimpleBar.instances.has(el)
        )
          new SimpleBar(el, getOptions(el.attributes));
      }
    );
  }

  removeObserver() {
    SimpleBar.globalObserver?.disconnect();
  }

  static initHtmlApi() {
    this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this);

    // MutationObserver is IE11+
    if (typeof MutationObserver !== 'undefined') {
      // Mutation observer to observe dynamically added elements
      this.globalObserver = new MutationObserver(SimpleBar.handleMutations);

      this.globalObserver.observe(document, { childList: true, subtree: true });
    }

    // Taken from jQuery `ready` function
    // Instantiate elements already present on the page
    if (
      document.readyState === 'complete' || // @ts-ignore: IE specific
      (document.readyState !== 'loading' && !document.documentElement.doScroll)
    ) {
      // Handle it asynchronously to allow scripts the opportunity to delay init
      window.setTimeout(this.initDOMLoadedElements);
    } else {
      document.addEventListener('DOMContentLoaded', this.initDOMLoadedElements);
      window.addEventListener('load', this.initDOMLoadedElements);
    }
  }

  static handleMutations(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      Array.prototype.forEach.call(mutation.addedNodes, (addedNode) => {
        if (addedNode.nodeType === 1) {
          if (addedNode.hasAttribute('data-simplebar')) {
            !SimpleBar.instances.has(addedNode) &&
              document.documentElement.contains(addedNode) &&
              new SimpleBar(addedNode, getOptions(addedNode.attributes));
          } else {
            Array.prototype.forEach.call(
              addedNode.querySelectorAll('[data-simplebar]'),
              function (el) {
                if (
                  el.getAttribute('data-simplebar') !== 'init' &&
                  !SimpleBar.instances.has(el) &&
                  document.documentElement.contains(el)
                )
                  new SimpleBar(el, getOptions(el.attributes));
              }
            );
          }
        }
      });

      Array.prototype.forEach.call(mutation.removedNodes, (removedNode) => {
        if (removedNode.nodeType === 1) {
          if (removedNode.getAttribute('data-simplebar') === 'init') {
            SimpleBar.instances.has(removedNode) &&
              !document.documentElement.contains(removedNode) &&
              SimpleBar.instances.get(removedNode).unMount();
          } else {
            Array.prototype.forEach.call(
              removedNode.querySelectorAll('[data-simplebar="init"]'),
              (el) => {
                SimpleBar.instances.has(el) &&
                  !document.documentElement.contains(el) &&
                  SimpleBar.instances.get(el).unMount();
              }
            );
          }
        }
      });
    });
  }
}

/**
 * HTML API
 * Called only in a browser env.
 */
if (canUseDOM) {
  SimpleBar.initHtmlApi();
}