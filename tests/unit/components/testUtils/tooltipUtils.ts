import type { DOMWrapper } from "@vue/test-utils";

export const expectTooltipContents = async (triggerEl: DOMWrapper<HTMLElement>, expectedContents: string[]) => {
  await triggerEl.trigger("focus");
  vi.advanceTimersByTime(1);
  await nextTick();
  expectedContents.forEach((content) => {
    expect(document.body.innerHTML).toContain(content);
  });
};
