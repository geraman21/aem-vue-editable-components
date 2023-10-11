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
import { Constants } from "../Constants";
import { defineComponent, h, type Component as VueConstructor } from "vue";

/**
 * Configuration object of the withEditable function.
 *
 * @property emptyLabel - Label to be displayed on the overlay when the component is empty
 * @property isEmpty - Callback function to determine if the component is empty
 * @property resourceType - AEM ResourceType to be added as an attribute on the editable component dom
 */
export interface EditConfig {
  emptyLabel?: string;
  isEmpty(props: any): boolean;
  resourceType?: string;
  isInEditor?: boolean;
  cqPath?: string;
  cqForceReload?: boolean;
}

@Component({
  components: {},
})
export class EditableComponentProperties extends Vue {
  @Prop() componentProperties!: any;
  @Prop() editConfig!: EditConfig;
  @Prop() wrappedComponent!: VueConstructor;
  @Prop() containerProps!: { [key: string]: string };
  @Prop({ default: false }) cqForceReload?: boolean;
  @Prop({ default: false }) isInEditor!: boolean;
  @Prop({ default: "" }) cqPath!: string;
  @Prop({ default: false }) aemNoDecoration!: boolean;
}

/**
 * The EditableComponent provides components with editing capabilities.
 */
@Component({
  components: {},
  render: function (this: EditableComponent) {
    const Component = this.wrappedComponent;
    const componentElement = (
      <Component
        props={this.state.componentProperties}
        componentProperties={this.state.componentProperties}
        key={this.className}
      />
    );
    if (!this.isInEditor && this.aemNoDecoration) {
      return componentElement;
    } else {
      return (
        <div {...this.editProps} class={this.className}>
          {componentElement}
          <div {...this.emptyPlaceholderProps} />
        </div>
      );
    }
  },
})
class EditableComponentClass extends mixins(EditableComponentProperties) {
  get state() {
    return this.$props as EditableComponentProperties;
  }

  /**
   * Properties related to the editing of the component.
   */
  get editProps() {
    const componentProperties = this.componentProperties;

    if (componentProperties && !componentProperties.isInEditor) {
      return {};
    }

    return {
      attrs: {
        "data-cq-data-path": componentProperties && componentProperties.cqPath,
        "data-cq-resource-type": this.editConfig.resourceType
          ? this.editConfig.resourceType
          : "",
      },
    };
  }

  /**
   * Should an empty placeholder be added.
   *
   * @return
   */
  useEmptyPlaceholder() {
    return (
      this.componentProperties &&
      this.componentProperties.isInEditor &&
      typeof this.editConfig.isEmpty === "function" &&
      this.editConfig.isEmpty(this.componentProperties)
    );
  }

  protected get emptyPlaceholderProps() {
    if (!this.useEmptyPlaceholder()) {
      return null;
    }

    return {
      class: Constants._PLACEHOLDER_CLASS_NAMES,
      attrs: {
        "data-emptytext": this.editConfig.emptyLabel,
      },
    };
  }

  /**
   *  Computed getter used to keep track of changes with the CSS classes.
   */
  get className() {
    return `${
      this.componentProperties.cssClassNames
        ? this.componentProperties.cssClassNames
        : ""
    } ${
      this.state.containerProps && this.state.containerProps.class
        ? this.state.containerProps.class
        : ""
    }`;
  }
}

const EditableComponent = toNative(EditableComponentClass);
export default EditableComponent;

/**
 * Returns a component wrapper that provides editing capabilities to the component.
 *
 * @param WrappedComponent
 * @param editConfig
 */
export function withEditable(
  WrappedComponent: VueConstructor,
  editConfig?: EditConfig
): VueConstructor {
  const defaultEditConfig = editConfig || { isEmpty: (props: any) => false };
  return defineComponent({
    functional: true,
    name: "EditableComponent",
    setup(props, context) {
      return () =>
        h(EditableComponent, {
          attrs: {
            ...context.attrs,
          },
          props: {
            ...props,
            componentProperties: { ...props },
            editConfig: defaultEditConfig,
            wrappedComponent: WrappedComponent,
          },
        });
    },
  });
}
