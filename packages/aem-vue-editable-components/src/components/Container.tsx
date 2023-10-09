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

// export default toNative(Container)
