<template>
  <main :class="`content-page`">
    <CmsContent :cq-path="contentPath" />
  </main>
</template>

<script setup lang="ts">
async function getContentPageBySlug() {
  const aemEndpoint =
    "https://publish.dev1.amer.cms.aldi.cx/content/aldi-sample/amer/us/web/main/en/components/rich-text.content.v1.api/content.json";

  return await $fetch(aemEndpoint);
}

const { data: page } = await useAsyncData<any>("loadContentPageBySlug", () =>
  getContentPageBySlug()
);

const Constants = {
  EXPERIENCE_FRAGMENT_PATH_PREFIX: "/content/experience-fragments/",
  NN_JCR_CONTENT: "jcr:content",
  PN_CQ_PATH: ':path',
};

function isExperienceFragment(urlPath: string | undefined): boolean {
  if (!urlPath) {
    return false;
  }
  return urlPath.startsWith(Constants.EXPERIENCE_FRAGMENT_PATH_PREFIX);
}

const contentPath = computed(() => {
  if(!page.value){
    return "";
  }
  
  const urlPath = page.value._links.self.href;
  const pageUrl = new URL(urlPath);
  const contentNode = page.value.data?.content[0]
  const pagePath = contentNode[Constants.PN_CQ_PATH]

  if (isExperienceFragment(pageUrl?.pathname)) {
    return pagePath + "/" + Constants.NN_JCR_CONTENT + "/root";
  }
  return pagePath + "/" + Constants.NN_JCR_CONTENT + "/root/content";
});
</script>
