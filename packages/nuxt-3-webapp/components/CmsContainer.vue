<script lang="ts">
import { VNode, defineComponent, h } from "vue";
import {
  Constants,
  Container,
  Utils,
} from "@mavice/aem-vue-editable-components";
import CmsContentLayout from "~/components/cms/CmsContentLayout/CmsContentLayout.vue";

/**
 * Customized version of the generic CMS container component from aem-vue-editable-components.
 * This e.g. allows using a custom items order and supplying additional properties to child components
 * and should be used in all instances where a CMS container is required.
 */
export default defineComponent({
  name: "CmsContainer",
  mixins: [Container],
  setup() {
    function splitCmsContentAtPlaceholder(
      itemsOrder: Array<string>,
      items: { [componentKey: string]: any },
      placeholderComponentType: string
    ): any {
      if (!items || !itemsOrder) {
        return {
          top: null,
          bottom: null,
        };
      }

      const placeholderKey = Object.keys(items).find(
        (key) => items[key][":type"] === placeholderComponentType
      );
      if (!placeholderKey) {
        return {
          top: itemsOrder,
          bottom: null,
        };
      }

      const placeholderOrderIndex = itemsOrder.findIndex(
        (key) => key === placeholderKey
      );

      if (placeholderOrderIndex === -1) {
        return {
          top: itemsOrder,
          bottom: null,
        };
      }

      if (placeholderOrderIndex === 0) {
        return {
          top: null,
          bottom: itemsOrder,
        };
      }

      return {
        top: itemsOrder.slice(0, placeholderOrderIndex),
        bottom: itemsOrder.slice(placeholderOrderIndex + 1),
      };
    }

    return {
      splitCmsContentAtPlaceholder
    }
  },
  computed: {
    parentProps(): unknown {
      return this.$parent?.containerProps;
    },
    items(): unknown {
      return this.cqItems;
    },
    itemsOrder(): unknown {
      let itemsOrder = this.cqItemsOrder;
      // split content if requested via the parent (CmsContent) props
      if (this.parentProps?.cqItemsBefore) {
        itemsOrder = this.splitCmsContentAtPlaceholder(
          itemsOrder,
          this.items,
          this.parentProps?.cqItemsBefore
        ).top;
      }
      if (this.parentProps?.cqItemsAfter) {
        itemsOrder = this.splitCmsContentAtPlaceholder(
          itemsOrder,
          this.items,
          this.parentProps?.cqItemsAfter
        ).bottom;
      }
      return itemsOrder;
    },
    childItemsEditable(): boolean {
      return this.isInEditor;
    },
    // eslint-disable-next-line vue/no-unused-properties
    childComponents(): Array<VNode> {
      if (!this.items || !this.itemsOrder) {
        return [];
      }

      return this.itemsOrder.map((itemKey: any, index: any) => {
        const item = this.items[itemKey];
        if (!item) {
          return null;
        }

        const itemProps = Utils.modelToProps(item);
        if (itemProps) {
          const itemComponent = this.getMappingComponent(itemProps.cqType);
          const itemPath = this.getItemPath(itemKey);
          const containerProps = this.getItemComponentProps(
            itemPath,
            index,
            itemKey
          );
          const el = h(itemComponent, {
            props: {
              cqPath: itemPath,
              cqForceReload: false,
              isInEditor: this.childItemsEditable,
              aemNoDecoration: true,
              containerProps,
              itemKey,
            },
          });

          return this.withContentLayout(el, itemProps, itemKey);
        }
        return null;
      });
    },
  },
  methods: {
    /* Overridden to work on both page and container level */
    getItemPath(itemKey: string): string {
      if (this.cqPath) {
        return this.cqPath.includes(Constants.JCR_CONTENT)
          ? this.cqPath + "/" + itemKey
          : this.cqPath + "/" + Constants.JCR_CONTENT + "/" + itemKey;
      }
      return itemKey;
    },
    /**
     * Should be implemented in container components that contain editable
     * components which need additional properties that are not provided by AEM
      @param {string} itemPath
      @param {number} itemIndex
      @param {string} itemKey
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAdditionalItemProps(
      itemPath: string,
      itemIndex: number,
      itemKey: string
    ): unknown {
      return {};
    },
    /**
     * Should be implemented in container components that contain editable
     * components which need event listeners
      @param {string} itemPath
      @param {number} itemIndex
      @param {string} itemKey
     */
    getItemComponentProps(
      itemPath: string,
      itemIndex: number,
      itemKey: string
    ): unknown {
      const props = Utils.modelToProps(this.items[itemKey]);
      const additionalProps = this.getAdditionalItemProps(
        itemPath,
        itemIndex,
        itemKey
      );
      return {
        ...props,
        ...additionalProps,
        itemIndex,
      };
    },
    getMappingComponent(cqType: string): string {
      let itemComponent = this.state.componentMapping.get(cqType);

      if (!itemComponent) {
        this.$log.info(
          `No cms mapping component found for type: ${cqType}. render the component with CmsDummy component`
        );

        const RESOURCE_TYPE_CMS_DUMMY = "aldi/core/components/cmsdummy";
        // use CmsDummy to render components without mapping definition.
        // used for components that is implemented in backend but not yet in frontend
        itemComponent = this.state.componentMapping.get(
          RESOURCE_TYPE_CMS_DUMMY
        );
      }
      return itemComponent;
    },
    withContentLayout(vnode: VNode, itemProps: any, itemKey: any): unknown {
      console.log("[CMSContainer][withContentLayout] vnode.data", vnode.data);

      const isMainContainer = this.parentProps?.isMainContainer;
      if (isMainContainer) {
        const containerBackgroundColorClass =
          vnode.data?.props?.containerProps?.rowBackgroundColor;
        const containerBackgroundColorStyle =
          vnode.data?.props?.containerProps?.rowBackgroundColorValue;
        // "rename" into componentType, because "imageVariant" is misleading in the wrapper-context
        const componentType = vnode.data?.props?.containerProps?.imageVariant;
        const cqType = itemProps.cqType;
        const placeHolderKey = itemProps.placeholderKey;
        const containerProps = {
          cqType,
          placeHolderKey,
          containerBackgroundColorClass,
          containerBackgroundColorStyle,
          componentType,
        };
        // wrap component with CmsContentLayout to add top level margins/paddings
        return h(
          CmsContentLayout,
          { props: containerProps, attrs: { id: itemKey } },
          [vnode]
        );
      } else {
        return vnode;
      }
    },
  },
});
</script>
