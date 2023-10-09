import { VNode, defineComponent,h } from 'vue'
import { withModel } from '@mavice/aem-vue-editable-components'
import { AuthoringUtils } from '@adobe/aem-spa-page-model-manager'
import CmsContainer from './CmsContainer.vue'

/**
 * Generic component to be used to render CMS content in the webapp.
 */
export default defineComponent({
  name: 'CmsContent',
  props: {
    /**
     * Absolute path of the content to render.
     * Usually this should be based on the ':path' property from the content fetched by the AemService
     * to ensure that the content is actually available in the ModelManager.
     */
    // eslint-disable-next-line vue/no-unused-properties
    cqPath: {
      type: String,
      required: true,
    },
    cqType: {
      type: String,
      default: undefined,
    },
    /**
     * These props are used to render the content before or after the placeholder with the given resource type.
     * This is e.g. used on the CLP for rendering the content above resp. below the category list.
     */
    // eslint-disable-next-line vue/no-unused-properties
    cqItemsBefore: {
      type: String,
      default: undefined,
    },
    // eslint-disable-next-line vue/no-unused-properties
    cqItemsAfter: {
      type: String,
      default: undefined,
    },
    /**
     * is main container? if yes, wrap children components with CmsContentLayout that adds margin/padding.
     */
    // eslint-disable-next-line vue/no-unused-properties
    isMainContainer: {
      type: Boolean,
      default: true,
    },
  },
  render(): VNode {
     let component = CmsContainer as any
    
    return h('div', { class: 'cms-content-page' }, [
      h(withModel(component), {
        props: {
          ...this.$props,
          isInEditor: AuthoringUtils.isInEditor(),
          // Skip generation of AEM edit decoration tags (when not in editor)
          aemNoDecoration: true,
          containerProps: this.$props,
        },
      }),
    ])
  },
})
