<template>
  <div
    id="advanced-usage-popover-container"
    ref="popoverContainer"
    :class="{ 'd-none': !props.display, 'd-flex': props.display }"
  >
    <CPopover
      placement="bottom"
      :offset="[50 - (popoverWidthPx / 2), 10]"
      :container="popoverContainer"
    >
      <template #toggler="{ togglerId, on }">
        <p
          :aria-describedby="togglerId"
          class="text-secondary small mb-1 ms-auto trigger"
          v-on="on"
        >
          <span class="text-decoration-underline">Advanced usage</span>
          <CIcon icon="cilOptions" size="sm" class="ms-1" />
        </p>
      </template>
      <template #content>
        <div id="advanced-usage-popover">
          <p class="fw-bolder">
            Advanced usage
          </p>
          <p>This dashboard offers a simplified interface to the <code>DAEDALUS</code> model, allowing users to explore the model with a few top-level parameter options.</p>
          <p class="mb-0">
            For fine-grained control over model parameters and functionality, R users can run the model directly through
            <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
            <NuxtLink to="https://jameel-institute.github.io/daedalus/" target="_blank">the DAEDALUS R package</NuxtLink>.
          </p>
        </div>
      </template>
    </CPopover>
  </div>
</template>

<script lang="ts" setup>
import { CIcon } from "@coreui/icons-vue";

const props = defineProps({
  display: {
    type: Boolean,
    required: true,
  },
});

// Use div as container, instead of body, so that modal is not closed when popover is clicked
const popoverContainer = ref<HTMLElement | undefined>(undefined);
const popoverWidthPx = 300;
</script>

<style lang="scss" scoped>
p.trigger {
  cursor: pointer;
}
</style>
