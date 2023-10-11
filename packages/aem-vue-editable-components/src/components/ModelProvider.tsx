/*
 *  Copyright 2021 Mavice LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import "reflect-metadata";
import { Component, mixins, Prop, toNative, Vue } from "vue-facing-decorator";
import {
  Model,
  ModelManager,
  PathUtils,
} from "@adobe/aem-spa-page-model-manager";
import { Constants } from "../Constants";
import Utils from "../Utils";
import { defineComponent, h, Component as VueConstructor } from "vue";

/**
 * Configuration object of the withModel function.
 */
export interface ReloadableModelProperties {
  /*
   * Should the model cache be ignored when processing the component.
   */
  forceReload?: boolean;
  /**
   * Should the component data be retrieved from the aem page model
   * and passed down as props on componentMount
   */
  injectPropsOnInit?: boolean;
}

/*
 * @private
 */
@Component({
  components: {},
})
export class ModelProviderTypeMixin extends Vue {
  @Prop({ default: {} }) wrappedComponent!: VueConstructor;
  @Prop() cqPath!: string;
  @Prop({ default: true }) injectPropsOnInit?: boolean;
  @Prop() pagePath?: string;
  @Prop() itemPath?: string;
  @Prop({ default: false }) cqForceReload?: boolean;
  @Prop({ default: () => {} }) containerProps?: {};
  @Prop({ default: "" }) itemKey?: string;
}

/**
 * Wraps a portion of the page model into a Component.
 * Fetches content from AEM (using ModelManager) and inject it into the passed Vue Component.
 *
 * @private
 */
@Component({
  components: {},
})
class ModelProviderClass extends mixins(ModelProviderTypeMixin) {
  @Prop() isInEditor?: boolean;
  @Prop() aemNoDecoration?: boolean;

  public propsToState(props: any) {
    // Keep private properties from being passed as state
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { wrappedComponent, cqForceReload, injectPropsOnInit, ...state } =
      props;

    return state;
  }

  state = this.$props as ModelProvider;

  get childProps() {
    return this.state;
  }

  set childProps(props: any) {
    this.state = {
      ...this.state,
      ...props,
    };
  }

  /**
   * Update component state/props with given model.
   * @param data Model to update component with
   * @returns Whether the state was updated
   */
  updateState(data: Model | undefined): boolean {
    const { injectPropsOnInit } = this.$props as any;
    if (data && Object.keys(data).length > 0) {
      this.childProps = Utils.modelToProps(data);
      // Fire event once component model has been fetched and rendered to enable editing on AEM
      if (injectPropsOnInit && Utils.isInEditor()) {
        PathUtils.dispatchGlobalCustomEvent(
          Constants.ASYNC_CONTENT_LOADED_EVENT,
          {}
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Update model based on given resource path.
   * @param cqPath resource path
   */
  updateData(cqPath?: string): void {
    const { pagePath, itemPath, injectPropsOnInit } = this.$props as any;
    const path =
      cqPath ||
      this.cqPath ||
      (pagePath && Utils.getCQPath({ pagePath, itemPath, injectPropsOnInit }));

    if (!path) {
      return;
    }

    // Try to update state from ModelStore synchronously so that the model is immediately available for SSR
    if (!this.updateState(ModelManager.modelStore.getData(path))) {
      ModelManager.getData({ path, forceReload: this.cqForceReload })
        .then((data: Model) => this.updateState(data))
        .catch((error) => {
          console.log(error);
        });
    }
  }

  created() {
    const { pagePath, itemPath, injectPropsOnInit } = this.$props as any;
    let { cqPath } = this.$props as any;
    this.childProps = Utils.modelToProps(this.$props);

    cqPath = Utils.getCQPath({ pagePath, itemPath, injectPropsOnInit, cqPath });
    this.state.cqPath = cqPath;

    if (this.injectPropsOnInit) {
      this.updateData(cqPath);
    }

    ModelManager.addListener(cqPath, this.updateData);
  }

  destroyed() {
    ModelManager.removeListener(this.cqPath, this.updateData);
  }

  /**
   *  Computed getter used to keep track of changes with the CSS classes.
   */
  get className() {
    return (this.state.containerProps && this.state.containerProps.class) || "";
  }

  render(createElement: Function) {
    const Component = this.wrappedComponent;
    return <Component props={this.childProps} key={this.className} />;
  }
}

export const ModelProvider = toNative(ModelProviderClass);
/**
 * @param WrappedComponent Vue representation for the AEM resource types.
 * @param modelConfig General configuration object.
 */
export const withModel = (
  WrappedComponent: VueConstructor,
  modelConfig: ReloadableModelProperties = {}
) => {
  return defineComponent({
    functional: true,
    // props:['allowedComponents', 'columnClassNames', 'columnCount', 'containerProps', 'cqItems', 'cqItemsOrder', 'cqPath', 'cqType', 'gridClassnNames', 'isInEditor', 'itemPath', 'pagePath'],
    name: "ModelProvider",
    setup(props: any, context) {
      const forceReload =
        props.cqForceReload || modelConfig.forceReload || false;
      const injectPropsOnInit =
        props.injectPropsOnInit || modelConfig.injectPropsOnInit || true;
      return () =>
        h(ModelProvider, {
          attrs: {
            ...context.attrs,
          },
          props: {
            ...props,
            cqForceReload: forceReload,
            injectPropsOnInit: injectPropsOnInit,
            wrappedComponent: WrappedComponent,
          },
          key: props.containerProps
            ? props.cqPath + props.containerProps.class
            : props.cqPath,
        });
    },
  });
};
