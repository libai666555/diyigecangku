window.WORKS_READY = (async () => {
  try {
    const payload = (window.WORKS_PAYLOAD_CHUNKS || []).join("");
    if (!payload) {
      window.WORKS = window.WORKS || [];
      return window.WORKS;
    }

    if (!("DecompressionStream" in window)) {
      console.warn("当前浏览器不支持作品目录解压，已切换为轻量目录。");
      window.WORKS = window.WORKS || [];
      return window.WORKS;
    }

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    window.WORKS = JSON.parse(text);
    return window.WORKS;
  } catch (error) {
    console.warn("作品目录数据没有完整载入，已切换为轻量目录。", error);
    window.WORKS = window.WORKS || [];
    return window.WORKS;
  }
})();
