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

import { Component, Vue, Prop, toNative, mixins } from "vue-facing-decorator";
import { ComponentMapping } from "../ComponentMapping";
import { Model } from "@adobe/aem-spa-page-model-manager";
import { VNode } from "vue";
import Utils from "src/Utils";
import { Constants } from "src/Constants";
import { ContainerPlaceholder, PlaceHolderModel } from "./ContainerPlaceholder";

/**
 * Hold force reload state.
 */
@Component
export class ReloadForceAbleMixin extends Vue {
  @Prop({ default: false }) cqForceReload?: boolean;
}

/**
 * Properties given to every component runtime by the SPA editor.
 */
@Component({
  components: {},
  mixins: [toNative(ReloadForceAbleMixin)],
})
export class MappedComponentPropertiesMixin extends Vue {
  @Prop({ default: false }) isInEditor!: boolean;
  @Prop({ default: "" }) cqPath!: string;
  @Prop({ default: false }) aemNoDecoration!: boolean;
}

@Component({
  components: {},
})
export class ContainerStateMixin extends Vue {
  @Prop({}) componentMapping?: ComponentMapping;
}

@Component({
  components: {},
})
export class ContainerPropertiesMixins extends mixins(
  MappedComponentPropertiesMixin
) {
  @Prop({ default: () => {} }) cqItems!: { [key: string]: Model };
  @Prop({ default: () => [] }) cqItemsOrder?: string[];
  @Prop({ default: () => {} }) componentMapping?: {} | ComponentMapping;
}

@Component({
  components: {},
})
class ContainerClass extends mixins(
  ContainerPropertiesMixins,
  ContainerStateMixin
) {
  readonly state = {
    componentMapping: this.componentMapping || ComponentMapping,
  };

  /**
   * Returns the child components of this Container.
   * It will instantiate the child components if mapping exists.
   *
   * @returns An array with the components instantiated to JSX
   */
  get childComponents(): VNode[] {
    if (!this.cqItems || !this.cqItemsOrder) {
      return [];
    }
    // @ts-ignore
    return this.cqItemsOrder.map<VNode>((itemKey) => {
      const itemProps = Utils.modelToProps(this.cqItems[itemKey]);

      if (itemProps) {
        const ItemComponent = this.state.componentMapping.get(itemProps.cqType);

        if (ItemComponent) {
          return this.connectComponentWithItem(
            ItemComponent,
            itemProps,
            itemKey
          );
        }
      }
    });
  }

  /**
   * Connects a child component with the item data.
   *
   * @param ChildComponent
   * @param itemProps
   * @param itemKey
   * @returns The Vue element constructed by connecting the values of the input with the Component.
   */
  protected connectComponentWithItem(
    ChildComponent: any,
    itemProps: any,
    itemKey: any
  ): VNode {
    const itemPath = this.getItemPath(itemKey);
    const isInEditor = this.isInEditor;
    const containerProps = this.getItemComponentProps(
      itemPath,
      itemKey,
      itemPath
    );
    return (
      <ChildComponent
        props={itemProps}
        cqPath={itemPath}
        isInEditor={isInEditor}
        itemKey={
          containerProps.columnClassNames &&
          containerProps.columnClassNames[itemKey]
        }
        containerProps={containerProps}
      />
    );
  }

  /**
   * Returns the properties to add on a specific child component.
   *
   * @param item
   * @param itemKey
   * @param itemPath
   * @returns The map of properties.
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  getItemComponentProps(
    item: any,
    itemKey: string,
    itemPath: string
  ): { [key: string]: string } {
    return Utils.modelToProps(this.cqItems[itemKey]);
  }

  /**
   * Returns the path of given item.
   *
   * @param itemKey
   * @returns The computed path.
   */
  getItemPath(itemKey: string) {
    return this.cqPath ? this.cqPath + "/" + itemKey : itemKey;
  }

  /**
   * The properties for the root element of the container.
   *
   * @returns The map of properties.
   */
  get containerAttrs(): any {
    const props: any = {
      class: Constants._CONTAINER_CLASS_NAMES,
      attrs: {},
    };

    if (this.isInEditor) {
      props.attrs[Constants.DATA_PATH_ATTR] = this.cqPath;
    }

    return props;
  }

  /**
   * The properties for the placeholder component in root element.
   *
   * @returns The map of properties to be added.
   */
  get placeholderProps(): PlaceHolderModel {
    return {
      cqPath: this.cqPath,
      placeholderClassNames: Constants.NEW_SECTION_CLASS_NAMES,
    };
  }

  placeholderComponent(): VNode | null {
    const placeholderProps = this.placeholderProps;

    if (!this.isInEditor) {
      return null;
    }

    return (
      <ContainerPlaceholder
        cqPath={placeholderProps.cqPath}
        placeholderClassNames={placeholderProps.placeholderClassNames}
      />
    );
  }

  render(createElement: Function) {
    if (!this.isInEditor && this.aemNoDecoration) {
      return <fragment>{this.childComponents}</fragment>;
    } else {
      return (
        <div {...this.containerAttrs}>
          {this.childComponents}
          {this.placeholderComponent()}
        </div>
      );
    }
  }
}

export const Container = toNative(ContainerClass);
